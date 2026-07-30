import { formatBaseUnits, toBaseUnits } from "../money.ts";
import type { Money } from "../intent/types.ts";
import {
  IdempotencyConflictError,
  RuntimeValidationError,
  type BillingPort,
  type BillingReceipt,
  type BillingReservation,
  type BillingReservationInput,
  type BillingSettlementInput,
  type ModelUsage
} from "./types.ts";

type ReservationState = "reserved" | "settled" | "released";

interface StoredReservation {
  reservation: BillingReservation;
  fingerprint: string;
  state: ReservationState;
  receipt?: BillingReceipt;
  settlementFingerprint?: string;
}

export interface InMemoryBalance {
  currency: string;
  credited: string;
  reserved: string;
  settled: string;
  available: string;
}

export interface BillingEvent {
  eventId: string;
  type: "credited" | "reserved" | "settled" | "released";
  userId: string;
  projectId?: string;
  reservationId?: string;
  amount: Money;
  at: string;
}

/**
 * Deterministic reference adapter for tests and local demos only. It has no
 * authentication, durability, multi-process locking, or payment integration.
 */
export class InMemoryBilling implements BillingPort {
  private readonly credits = new Map<string, bigint>();
  private readonly reservations = new Map<string, StoredReservation>();
  private readonly events: BillingEvent[] = [];
  private nextId = 1;

  credit(projectId: string, userId: string, amount: Money): void {
    assertUserId(projectId);
    assertUserId(userId);
    assertNonNegativeMoney(amount, "credit amount", false);
    const key = accountKey(projectId, userId, amount.currency);
    this.credits.set(key, (this.credits.get(key) ?? 0n) + toBaseUnits(amount.amount));
    this.recordEvent({ type: "credited", projectId, userId, amount });
  }

  async reserve(input: BillingReservationInput): Promise<BillingReservation> {
    validateReservationInput(input);
    const key = idempotencyKey(input.userId, input.projectId, input.requestId);
    const existing = this.reservations.get(key);
    if (existing) {
      if (
        existing.fingerprint !== input.requestFingerprint ||
        !sameMoney(existing.reservation.maximumCharge, input.maximumCharge)
      ) {
        throw new IdempotencyConflictError(
          `requestId ${input.requestId} was reused with different billing data`
        );
      }
      if (existing.state !== "reserved") {
        if (existing.state === "released") {
          const available = this.availableBaseUnits(
            input.projectId,
            input.userId,
            input.maximumCharge.currency
          );
          if (available < toBaseUnits(input.maximumCharge.amount)) {
            throw new RuntimeValidationError(
              "insufficient available balance for the requested maximum charge"
            );
          }
          existing.state = "reserved";
          this.recordEvent({
            type: "reserved",
            userId: existing.reservation.userId,
            projectId: existing.reservation.projectId,
            reservationId: existing.reservation.reservationId,
            amount: existing.reservation.maximumCharge
          });
          return cloneReservation(existing.reservation);
        }
        throw new RuntimeValidationError(
          `requestId ${input.requestId} cannot be reserved after ${existing.state}`
        );
      }
      return cloneReservation(existing.reservation);
    }

    const available = this.availableBaseUnits(
      input.projectId,
      input.userId,
      input.maximumCharge.currency
    );
    const maximum = toBaseUnits(input.maximumCharge.amount);
    if (available < maximum) {
      throw new RuntimeValidationError(
        "insufficient available balance for the requested maximum charge"
      );
    }

    const reservation: BillingReservation = {
      reservationId: `res_${this.nextId++}`,
      requestId: input.requestId,
      userId: input.userId,
      projectId: input.projectId,
      maximumCharge: cloneMoney(input.maximumCharge),
      state: "reserved"
    };
    this.reservations.set(key, {
      reservation,
      fingerprint: input.requestFingerprint,
      state: "reserved"
    });
    this.recordEvent({
      type: "reserved",
      userId: input.userId,
      projectId: input.projectId,
      reservationId: reservation.reservationId,
      amount: reservation.maximumCharge
    });
    return cloneReservation(reservation);
  }

  async settle(input: BillingSettlementInput): Promise<BillingReceipt> {
    const stored = this.findByReservationId(input.reservationId);
    assertNonNegativeMoney(input.actualCharge, "actual charge", true);
    assertUsage(input.usage);
    assertFingerprint(input.settlementFingerprint, "settlementFingerprint");
    assertUserId(input.providerRequestId);
    assertUserId(input.deliveryId);
    if (!sameCurrency(stored.reservation.maximumCharge, input.actualCharge)) {
      throw new RuntimeValidationError("settlement currency differs from the reservation currency");
    }
    if (
      toBaseUnits(input.actualCharge.amount) > toBaseUnits(stored.reservation.maximumCharge.amount)
    ) {
      throw new RuntimeValidationError("settlement amount exceeds reserved maximum");
    }
    if (stored.state === "settled") {
      if (
        !stored.receipt ||
        stored.settlementFingerprint !== input.settlementFingerprint ||
        !sameMoney(stored.receipt.charged, input.actualCharge) ||
        !sameUsage(stored.receipt.usage, input.usage) ||
        stored.receipt.providerRequestId !== input.providerRequestId ||
        stored.receipt.deliveryId !== input.deliveryId
      ) {
        throw new IdempotencyConflictError(
          "reservation was already settled with a different amount"
        );
      }
      return cloneReceipt(stored.receipt);
    }
    if (stored.state !== "reserved") {
      throw new RuntimeValidationError(`cannot settle a ${stored.state} reservation`);
    }

    const receipt: BillingReceipt = {
      receiptId: `rcpt_${this.nextId++}`,
      reservationId: stored.reservation.reservationId,
      requestId: stored.reservation.requestId,
      userId: stored.reservation.userId,
      projectId: stored.reservation.projectId,
      providerRequestId: input.providerRequestId,
      deliveryId: input.deliveryId,
      charged: cloneMoney(input.actualCharge),
      usage: { ...input.usage },
      settledAt: new Date().toISOString()
    };
    stored.state = "settled";
    stored.receipt = receipt;
    stored.settlementFingerprint = input.settlementFingerprint;
    this.recordEvent({
      type: "settled",
      userId: receipt.userId,
      projectId: receipt.projectId,
      reservationId: receipt.reservationId,
      amount: receipt.charged
    });
    return cloneReceipt(receipt);
  }

  async release(reservationId: string, reason: "not_executed"): Promise<void> {
    if (reason !== "not_executed") {
      throw new RuntimeValidationError("only definitively unexecuted reservations may be released");
    }
    const stored = this.findByReservationId(reservationId);
    if (stored.state === "released") return;
    if (stored.state !== "reserved") {
      throw new RuntimeValidationError(`cannot release a ${stored.state} reservation`);
    }
    stored.state = "released";
    this.recordEvent({
      type: "released",
      userId: stored.reservation.userId,
      projectId: stored.reservation.projectId,
      reservationId,
      amount: stored.reservation.maximumCharge
    });
  }

  balance(projectId: string, userId: string, currency: string): InMemoryBalance {
    assertUserId(projectId);
    assertUserId(userId);
    assertCurrency(currency);
    const credited = this.credits.get(accountKey(projectId, userId, currency)) ?? 0n;
    let reserved = 0n;
    let settled = 0n;
    for (const stored of this.reservations.values()) {
      if (
        stored.reservation.userId !== userId ||
        stored.reservation.projectId !== projectId ||
        stored.reservation.maximumCharge.currency !== currency
      ) {
        continue;
      }
      if (stored.state === "reserved")
        reserved += toBaseUnits(stored.reservation.maximumCharge.amount);
      if (stored.state === "settled") settled += toBaseUnits(stored.receipt!.charged.amount);
    }
    return {
      currency,
      credited: formatBaseUnits(credited),
      reserved: formatBaseUnits(reserved),
      settled: formatBaseUnits(settled),
      available: formatBaseUnits(credited - reserved - settled)
    };
  }

  auditEvents(): readonly BillingEvent[] {
    return this.events.map((event) => ({ ...event, amount: cloneMoney(event.amount) }));
  }

  private availableBaseUnits(projectId: string, userId: string, currency: string): bigint {
    return toBaseUnits(this.balance(projectId, userId, currency).available);
  }

  private findByReservationId(reservationId: string): StoredReservation {
    if (!reservationId || typeof reservationId !== "string") {
      throw new RuntimeValidationError("reservationId must be a non-empty string");
    }
    for (const stored of this.reservations.values()) {
      if (stored.reservation.reservationId === reservationId) return stored;
    }
    throw new RuntimeValidationError("unknown reservation ID");
  }

  private recordEvent(event: Omit<BillingEvent, "eventId" | "at"> & { at?: string }): void {
    this.events.push({
      ...event,
      eventId: `evt_${this.nextId++}`,
      amount: cloneMoney(event.amount),
      at: event.at ?? new Date().toISOString()
    });
  }
}

function validateReservationInput(input: BillingReservationInput): void {
  if (!input || typeof input !== "object") {
    throw new RuntimeValidationError("reservation input must be an object");
  }
  assertUserId(input.userId);
  assertUserId(input.projectId);
  assertUserId(input.requestId);
  if (
    typeof input.requestFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(input.requestFingerprint)
  ) {
    throw new RuntimeValidationError("requestFingerprint must be a SHA-256 hexadecimal digest");
  }
  if (input.operation !== "model.chat") {
    throw new RuntimeValidationError("unsupported billing operation");
  }
  assertNonNegativeMoney(input.maximumCharge, "maximum charge", false);
}

function assertUsage(usage: ModelUsage): void {
  if (
    !usage ||
    !Number.isSafeInteger(usage.inputTokens) ||
    !Number.isSafeInteger(usage.outputTokens) ||
    !Number.isSafeInteger(usage.totalTokens) ||
    usage.inputTokens < 0 ||
    usage.outputTokens < 0 ||
    usage.totalTokens !== usage.inputTokens + usage.outputTokens
  ) {
    throw new RuntimeValidationError("usage must contain non-negative, matching token counts");
  }
}

function assertNonNegativeMoney(money: Money, name: string, allowZero: boolean): void {
  if (!money || typeof money.amount !== "string") {
    throw new RuntimeValidationError(`${name} must contain an amount and currency`);
  }
  assertCurrency(money.currency);
  const amount = toBaseUnits(money.amount);
  if (amount < 0n || (!allowZero && amount === 0n)) {
    throw new RuntimeValidationError(`${name} must be ${allowZero ? "non-negative" : "positive"}`);
  }
}

function assertUserId(value: string): void {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 256 ||
    /[\u0000\r\n]/.test(value)
  ) {
    throw new RuntimeValidationError(
      "identifier must be a non-empty string of at most 256 characters"
    );
  }
}

function assertCurrency(currency: string): void {
  if (typeof currency !== "string" || !/^[A-Z0-9-]{2,16}$/.test(currency)) {
    throw new RuntimeValidationError(
      "currency must be 2-16 uppercase letters, numbers, or hyphens"
    );
  }
}

function assertFingerprint(value: string, name: string): void {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value)) {
    throw new RuntimeValidationError(`${name} must be a SHA-256 hexadecimal digest`);
  }
}

function idempotencyKey(userId: string, projectId: string, requestId: string): string {
  return `${userId}\u0000${projectId}\u0000${requestId}`;
}

function accountKey(projectId: string, userId: string, currency: string): string {
  return `${projectId}\u0000${userId}\u0000${currency}`;
}

function sameMoney(left: Money, right: Money): boolean {
  return sameCurrency(left, right) && toBaseUnits(left.amount) === toBaseUnits(right.amount);
}

function sameCurrency(left: Money, right: Money): boolean {
  return left.currency === right.currency;
}

function sameUsage(left: ModelUsage, right: ModelUsage): boolean {
  return (
    left.inputTokens === right.inputTokens &&
    left.outputTokens === right.outputTokens &&
    left.totalTokens === right.totalTokens
  );
}

function cloneMoney(money: Money): Money {
  return { amount: money.amount, currency: money.currency };
}

function cloneReservation(reservation: BillingReservation): BillingReservation {
  return { ...reservation, maximumCharge: cloneMoney(reservation.maximumCharge) };
}

function cloneReceipt(receipt: BillingReceipt): BillingReceipt {
  return { ...receipt, charged: cloneMoney(receipt.charged), usage: { ...receipt.usage } };
}
