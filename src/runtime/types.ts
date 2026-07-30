import type { Money } from "../intent/types.ts";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  /** Stable, caller-created key for safe retries of this business operation. */
  requestId: string;
  /** Authenticated application user. Production adapters must authorize it server-side. */
  userId: string;
  /** Tenant-scoped project selected by the authenticated application. */
  projectId: string;
  /** Provider/model alias, for example `auto` or `openai/gpt-5`. */
  model: string;
  messages: ChatMessage[];
  /** Exact upper bound authorized for this invocation. */
  maxCharge: Money;
}

export interface ModelUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface ModelInvocation {
  requestId: string;
  /** Opaque idempotency key for the provider/gateway attempt; never contains prompt text. */
  providerIdempotencyKey: string;
  userId: string;
  projectId: string;
  model: string;
  messages: ChatMessage[];
}

export interface ModelCompletion {
  content: string;
  model: string;
  provider: string;
  /** Persisted provider-attempt reference required for reconciliation. */
  providerRequestId: string;
  /** Persisted delivery reference tying returned content to a receipt. */
  deliveryId: string;
  usage: ModelUsage;
  /** Exact end-user charge, calculated by the trusted X-Agent gateway under project pricing. */
  actualCharge: Money;
}

export interface ModelCallOptions {
  signal?: AbortSignal;
}

export interface ModelProvider {
  chat(input: ModelInvocation, options?: ModelCallOptions): Promise<ModelCompletion>;
}

export type ModelFailureOutcome = "not_executed" | "unknown";

/**
 * A provider adapter uses this only when it can classify whether work reached a
 * provider. Unknown outcomes deliberately retain the reservation for recovery.
 */
export class ModelCallError extends Error {
  constructor(
    message: string,
    public readonly outcome: ModelFailureOutcome,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "ModelCallError";
  }
}

export interface BillingReservationInput {
  requestId: string;
  requestFingerprint: string;
  userId: string;
  projectId: string;
  maximumCharge: Money;
  operation: "model.chat";
}

export interface BillingReservation {
  reservationId: string;
  requestId: string;
  userId: string;
  projectId: string;
  maximumCharge: Money;
  state: "reserved";
}

export interface BillingSettlementInput {
  reservationId: string;
  settlementFingerprint: string;
  providerRequestId: string;
  deliveryId: string;
  actualCharge: Money;
  usage: ModelUsage;
}

export interface BillingReceipt {
  receiptId: string;
  reservationId: string;
  requestId: string;
  userId: string;
  projectId: string;
  providerRequestId: string;
  deliveryId: string;
  charged: Money;
  usage: ModelUsage;
  settledAt: string;
}

export interface BillingPort {
  reserve(input: BillingReservationInput): Promise<BillingReservation>;
  settle(input: BillingSettlementInput): Promise<BillingReceipt>;
  release(reservationId: string, reason: "not_executed"): Promise<void>;
}

export interface ChatResult {
  content: string;
  model: string;
  provider: string;
  usage: ModelUsage;
  receipt: BillingReceipt;
}

export interface XAgentRuntimeOptions {
  model: ModelProvider;
  billing: BillingPort;
  /** Bounded in-process replay cache. A durable gateway remains mandatory in production. */
  maxCachedExecutions?: number;
  /** Hard deadline for a provider adapter. Unknown timeout outcomes require reconciliation. */
  modelTimeoutMs?: number;
}

export class RuntimeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RuntimeValidationError";
  }
}

export class IdempotencyConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IdempotencyConflictError";
  }
}

export class IndeterminateExecutionError extends Error {
  constructor(public readonly reservationId: string) {
    super("model execution outcome is unknown; reconcile the reservation before retrying");
    this.name = "IndeterminateExecutionError";
  }
}

export class SettlementPendingError extends Error {
  constructor(
    public readonly reservationId: string,
    options?: ErrorOptions
  ) {
    super("model output is retained but settlement is pending; retry the same request ID", options);
    this.name = "SettlementPendingError";
  }
}

export type SettlementFailureOutcome = "retryable" | "unknown" | "permanent";

/** A billing adapter classifies settlement failures so the SDK never retries a permanent error blindly. */
export class SettlementError extends Error {
  constructor(
    message: string,
    public readonly outcome: SettlementFailureOutcome,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "SettlementError";
  }
}

export class SettlementRecoveryRequiredError extends Error {
  constructor(public readonly reservationId: string) {
    super("settlement requires gateway reconciliation before this request can be retried");
    this.name = "SettlementRecoveryRequiredError";
  }
}
