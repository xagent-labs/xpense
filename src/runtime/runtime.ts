import { createHash } from "node:crypto";
import { toBaseUnits } from "../money.ts";
import type { Money } from "../intent/types.ts";
import {
  IdempotencyConflictError,
  IndeterminateExecutionError,
  ModelCallError,
  RuntimeValidationError,
  SettlementError,
  SettlementPendingError,
  SettlementRecoveryRequiredError,
  type BillingReceipt,
  type BillingReservation,
  type ChatRequest,
  type ChatResult,
  type ModelCompletion,
  type XAgentRuntimeOptions
} from "./types.ts";

const DEFAULT_MAX_CACHED_EXECUTIONS = 1_000;
const DEFAULT_MODEL_TIMEOUT_MS = 60_000;
const MAX_IDENTIFIER_LENGTH = 256;
const MAX_MESSAGES = 100;
const MAX_MESSAGE_CHARS = 64 * 1024;
const MAX_TOTAL_MESSAGE_CHARS = 256 * 1024;

interface InFlightExecution {
  fingerprint: string;
  promise: Promise<ChatResult>;
}

interface PendingSettlement {
  fingerprint: string;
  request: ChatRequest;
  reservation: BillingReservation;
  completion: ModelCompletion;
}

interface IndeterminateExecution {
  fingerprint: string;
  reservationId: string;
}

/**
 * Framework-neutral orchestration for one billable model call. Real user
 * authorization, durable idempotency and money movement belong in BillingPort.
 */
export class XAgentRuntime {
  private readonly inFlight = new Map<string, InFlightExecution>();
  private readonly completed = new Map<string, { fingerprint: string; result: ChatResult }>();
  private readonly pendingSettlements = new Map<string, PendingSettlement>();
  private readonly indeterminate = new Map<string, IndeterminateExecution>();
  private readonly settlementRecovery = new Map<string, IndeterminateExecution>();
  private readonly maxCachedExecutions: number;
  private readonly modelTimeoutMs: number;

  constructor(private readonly options: XAgentRuntimeOptions) {
    if (!options?.model || typeof options.model.chat !== "function") {
      throw new RuntimeValidationError("model.chat must be a function");
    }
    if (!options?.billing || !isBillingPort(options.billing)) {
      throw new RuntimeValidationError("billing must implement reserve, settle, and release");
    }
    this.maxCachedExecutions = options.maxCachedExecutions ?? DEFAULT_MAX_CACHED_EXECUTIONS;
    if (!Number.isSafeInteger(this.maxCachedExecutions) || this.maxCachedExecutions <= 0) {
      throw new RuntimeValidationError("maxCachedExecutions must be a positive safe integer");
    }
    this.modelTimeoutMs = options.modelTimeoutMs ?? DEFAULT_MODEL_TIMEOUT_MS;
    if (!Number.isSafeInteger(this.modelTimeoutMs) || this.modelTimeoutMs < 1_000) {
      throw new RuntimeValidationError("modelTimeoutMs must be a safe integer of at least 1000");
    }
  }

  async chat(request: ChatRequest): Promise<ChatResult> {
    validateChatRequest(request);
    const key = executionKey(request);
    const fingerprint = fingerprintRequest(request);

    const completed = this.completed.get(key);
    if (completed) {
      assertMatchingFingerprint(completed.fingerprint, fingerprint, request.requestId);
      return completed.result;
    }

    const indeterminate = this.indeterminate.get(key);
    if (indeterminate) {
      assertMatchingFingerprint(indeterminate.fingerprint, fingerprint, request.requestId);
      throw new IndeterminateExecutionError(indeterminate.reservationId);
    }

    const settlementRecovery = this.settlementRecovery.get(key);
    if (settlementRecovery) {
      assertMatchingFingerprint(settlementRecovery.fingerprint, fingerprint, request.requestId);
      throw new SettlementRecoveryRequiredError(settlementRecovery.reservationId);
    }

    const pending = this.pendingSettlements.get(key);
    if (pending) {
      assertMatchingFingerprint(pending.fingerprint, fingerprint, request.requestId);
      return this.settlePending(key, pending);
    }

    const inFlight = this.inFlight.get(key);
    if (inFlight) {
      assertMatchingFingerprint(inFlight.fingerprint, fingerprint, request.requestId);
      return inFlight.promise;
    }

    const promise = this.execute(key, fingerprint, request).finally(() => {
      this.inFlight.delete(key);
    });
    this.inFlight.set(key, { fingerprint, promise });
    return promise;
  }

  private async execute(
    key: string,
    fingerprint: string,
    request: ChatRequest
  ): Promise<ChatResult> {
    const reservation = await this.options.billing.reserve({
      requestId: request.requestId,
      requestFingerprint: fingerprint,
      userId: request.userId,
      projectId: request.projectId,
      maximumCharge: request.maxCharge,
      operation: "model.chat"
    });
    assertReservationMatchesRequest(reservation, request);

    let completion: ModelCompletion;
    try {
      completion = await this.invokeModel({
        requestId: request.requestId,
        providerIdempotencyKey: providerIdempotencyKey(request),
        userId: request.userId,
        projectId: request.projectId,
        model: request.model,
        messages: request.messages
      });
      validateCompletion(completion, request.maxCharge);
    } catch (error) {
      if (error instanceof ModelCallError && error.outcome === "not_executed") {
        await this.options.billing.release(reservation.reservationId, "not_executed");
      } else {
        this.indeterminate.set(key, { fingerprint, reservationId: reservation.reservationId });
      }
      throw error;
    }

    const pending: PendingSettlement = { fingerprint, request, reservation, completion };
    this.pendingSettlements.set(key, pending);
    return this.settlePending(key, pending);
  }

  private async settlePending(key: string, pending: PendingSettlement): Promise<ChatResult> {
    try {
      const receipt = await this.options.billing.settle({
        reservationId: pending.reservation.reservationId,
        settlementFingerprint: fingerprintSettlement(pending.reservation, pending.completion),
        providerRequestId: pending.completion.providerRequestId,
        deliveryId: pending.completion.deliveryId,
        actualCharge: pending.completion.actualCharge,
        usage: pending.completion.usage
      });
      assertReceiptMatchesSettlement(receipt, pending);
      const result = toChatResult(pending.completion, receipt);
      this.pendingSettlements.delete(key);
      this.completed.set(key, { fingerprint: pending.fingerprint, result });
      this.trimCompleted();
      return result;
    } catch (error) {
      if (error instanceof SettlementError && error.outcome === "retryable") {
        throw new SettlementPendingError(pending.reservation.reservationId, { cause: error });
      }
      this.pendingSettlements.delete(key);
      this.settlementRecovery.set(key, {
        fingerprint: pending.fingerprint,
        reservationId: pending.reservation.reservationId
      });
      throw new SettlementRecoveryRequiredError(pending.reservation.reservationId);
    }
  }

  private async invokeModel(
    input: Parameters<XAgentRuntimeOptions["model"]["chat"]>[0]
  ): Promise<ModelCompletion> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.modelTimeoutMs);
    try {
      return await Promise.race([
        this.options.model.chat(input, { signal: controller.signal }),
        new Promise<never>((_resolve, reject) => {
          controller.signal.addEventListener(
            "abort",
            () => reject(new ModelCallError("model invocation timed out", "unknown")),
            { once: true }
          );
        })
      ]);
    } finally {
      clearTimeout(timeout);
    }
  }

  private trimCompleted(): void {
    while (this.completed.size > this.maxCachedExecutions) {
      const oldestKey = this.completed.keys().next().value;
      if (!oldestKey) return;
      this.completed.delete(oldestKey);
    }
  }
}

export function createXAgent(options: XAgentRuntimeOptions): XAgentRuntime {
  return new XAgentRuntime(options);
}

function isBillingPort(value: XAgentRuntimeOptions["billing"]): boolean {
  return (
    typeof value.reserve === "function" &&
    typeof value.settle === "function" &&
    typeof value.release === "function"
  );
}

function validateChatRequest(request: ChatRequest): void {
  if (!request || typeof request !== "object") {
    throw new RuntimeValidationError("chat request must be an object");
  }
  for (const [name, value] of [
    ["requestId", request.requestId],
    ["userId", request.userId],
    ["projectId", request.projectId],
    ["model", request.model]
  ] as const) {
    if (!isSafeIdentifier(value)) {
      throw new RuntimeValidationError(
        `${name} must be a non-empty string of at most 256 characters`
      );
    }
  }
  if (
    !Array.isArray(request.messages) ||
    request.messages.length === 0 ||
    request.messages.length > MAX_MESSAGES
  ) {
    throw new RuntimeValidationError(`messages must contain between 1 and ${MAX_MESSAGES} entries`);
  }
  let totalChars = 0;
  for (const message of request.messages) {
    if (!message || !["system", "user", "assistant", "tool"].includes(message.role)) {
      throw new RuntimeValidationError("messages contain an unsupported role");
    }
    if (typeof message.content !== "string" || message.content.length > MAX_MESSAGE_CHARS) {
      throw new RuntimeValidationError(
        `message content must be a string of at most ${MAX_MESSAGE_CHARS} characters`
      );
    }
    totalChars += message.content.length;
  }
  if (totalChars > MAX_TOTAL_MESSAGE_CHARS) {
    throw new RuntimeValidationError(
      `messages must not exceed ${MAX_TOTAL_MESSAGE_CHARS} characters`
    );
  }
  assertPositiveMoney(request.maxCharge, "maxCharge");
}

function validateCompletion(completion: ModelCompletion, maximumCharge: Money): void {
  if (!completion || typeof completion !== "object" || typeof completion.content !== "string") {
    throw new RuntimeValidationError("model provider returned an invalid completion");
  }
  if (
    !isSafeIdentifier(completion.model) ||
    !isSafeIdentifier(completion.provider) ||
    !isSafeIdentifier(completion.providerRequestId) ||
    !isSafeIdentifier(completion.deliveryId)
  ) {
    throw new RuntimeValidationError("model provider returned invalid execution references");
  }
  const usage = completion.usage;
  if (
    !usage ||
    !Number.isSafeInteger(usage.inputTokens) ||
    !Number.isSafeInteger(usage.outputTokens) ||
    !Number.isSafeInteger(usage.totalTokens) ||
    usage.inputTokens < 0 ||
    usage.outputTokens < 0 ||
    usage.totalTokens !== usage.inputTokens + usage.outputTokens
  ) {
    throw new RuntimeValidationError("model provider returned invalid usage");
  }
  assertPositiveMoney(completion.actualCharge, "model completion actualCharge", true);
  if (completion.actualCharge.currency !== maximumCharge.currency) {
    throw new RuntimeValidationError(
      "model completion currency differs from the reserved currency"
    );
  }
  if (toBaseUnits(completion.actualCharge.amount) > toBaseUnits(maximumCharge.amount)) {
    throw new RuntimeValidationError("model completion charge exceeds the reserved maximum");
  }
}

function assertReservationMatchesRequest(
  reservation: BillingReservation,
  request: ChatRequest
): void {
  if (
    !reservation ||
    reservation.state !== "reserved" ||
    reservation.requestId !== request.requestId ||
    reservation.userId !== request.userId ||
    reservation.projectId !== request.projectId ||
    !sameMoney(reservation.maximumCharge, request.maxCharge)
  ) {
    throw new RuntimeValidationError(
      "billing port returned a reservation that does not match the request"
    );
  }
}

function toChatResult(completion: ModelCompletion, receipt: BillingReceipt): ChatResult {
  return {
    content: completion.content,
    model: completion.model,
    provider: completion.provider,
    usage: completion.usage,
    receipt
  };
}

function fingerprintSettlement(
  reservation: BillingReservation,
  completion: ModelCompletion
): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        reservationId: reservation.reservationId,
        providerRequestId: completion.providerRequestId,
        deliveryId: completion.deliveryId,
        actualCharge: completion.actualCharge,
        usage: completion.usage
      })
    )
    .digest("hex");
}

function providerIdempotencyKey(request: ChatRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        projectId: request.projectId,
        userId: request.userId,
        requestId: request.requestId
      })
    )
    .digest("hex");
}

function assertReceiptMatchesSettlement(receipt: BillingReceipt, pending: PendingSettlement): void {
  const { reservation, request, completion } = pending;
  if (
    !receipt ||
    receipt.reservationId !== reservation.reservationId ||
    receipt.requestId !== request.requestId ||
    receipt.userId !== request.userId ||
    receipt.projectId !== request.projectId ||
    receipt.providerRequestId !== completion.providerRequestId ||
    receipt.deliveryId !== completion.deliveryId ||
    !sameMoney(receipt.charged, completion.actualCharge) ||
    !sameUsage(receipt.usage, completion.usage)
  ) {
    throw new RuntimeValidationError(
      "billing port returned a receipt that does not match settlement"
    );
  }
}

function executionKey(request: ChatRequest): string {
  return `${request.projectId}\u0000${request.userId}\u0000${request.requestId}`;
}

function fingerprintRequest(request: ChatRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        projectId: request.projectId,
        userId: request.userId,
        model: request.model,
        messages: request.messages,
        maxCharge: request.maxCharge
      })
    )
    .digest("hex");
}

function assertMatchingFingerprint(expected: string, actual: string, requestId: string): void {
  if (expected !== actual) {
    throw new IdempotencyConflictError(
      `requestId ${requestId} was reused with different request data`
    );
  }
}

function assertPositiveMoney(money: Money, name: string, allowZero = false): void {
  if (
    !money ||
    typeof money.amount !== "string" ||
    !/^[A-Z0-9-]{2,16}$/.test(money.currency ?? "")
  ) {
    throw new RuntimeValidationError(
      `${name} must contain a decimal amount and uppercase currency`
    );
  }
  const value = toBaseUnits(money.amount);
  if (value < 0n || (!allowZero && value === 0n)) {
    throw new RuntimeValidationError(`${name} must be ${allowZero ? "non-negative" : "positive"}`);
  }
}

function sameMoney(left: Money, right: Money): boolean {
  return left.currency === right.currency && toBaseUnits(left.amount) === toBaseUnits(right.amount);
}

function sameUsage(left: ModelCompletion["usage"], right: ModelCompletion["usage"]): boolean {
  return (
    left.inputTokens === right.inputTokens &&
    left.outputTokens === right.outputTokens &&
    left.totalTokens === right.totalTokens
  );
}

function isSafeIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_IDENTIFIER_LENGTH &&
    !/[\u0000\r\n]/.test(value)
  );
}
