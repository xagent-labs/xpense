export { Xpense } from "./agent/xpense.ts";
export type { XpenseOptions } from "./agent/xpense.ts";

export { resolveConfig } from "./config.ts";
export type { XpenseConfig } from "./config.ts";

export { PaymentIntentBuilder, buildFromDraft } from "./intent/builder.ts";
export { validatePaymentIntent, isDecimalString } from "./intent/validate.ts";
export { canTransition, transition, isTerminal } from "./intent/lifecycle.ts";
export { submitPaymentIntent } from "./settlement/submit.ts";
export type { TransportOptions } from "./settlement/submit.ts";
export type {
  AllowanceScope,
  AmountSpec,
  ApprovalMode,
  ApprovalRequirement,
  AuditEntry,
  AuditTrail,
  Counterparty,
  CounterpartyKind,
  GovernanceConstraints,
  IntentDeclaration,
  MandateRefs,
  Money,
  PaymentIntent,
  PaymentIntentDraft,
  PaymentIntentMode,
  PaymentIntentStatus,
  PaymentReason,
  PolicyConstraints,
  SettlementScheme,
  SubmitResult,
  TaskOrigin
} from "./intent/types.ts";

export { capabilities, capabilityMap } from "./agent/capabilities.ts";
export { MemoryDefaultStore } from "./agent/default-store.ts";
export type {
  EmitResult,
  PaymentDefault,
  PaymentDefaultStore,
  ToolContext,
  ToolDefinition,
  ToolResult
} from "./agent/tooling.ts";

export { PolicyEngine, BudgetExceededError } from "./governance/policy.ts";
export type { BudgetSpec, PolicyDecision } from "./governance/policy.ts";
export { GovernanceGate } from "./governance/gate.ts";
export type { GovernanceDecision, GovernanceOutcome } from "./governance/gate.ts";
export { approvalDecision } from "./governance/approval.ts";
export type { ApprovalDecision } from "./governance/approval.ts";

export { PaymentSession } from "./agent/ledger.ts";
export type { SessionEntry } from "./agent/ledger.ts";
export { createPayFetch } from "./settlement/pay-fetch.ts";
export type { PayFetchOptions } from "./settlement/pay-fetch.ts";

export { buildInjection } from "./agent/inject.ts";
export type {
  AgentInjection,
  InjectOptions,
  PaymentResolution,
  PendingDecision,
  PendingToolCall
} from "./agent/inject.ts";

export { OnchainosGateway } from "./settlement/onchainos.ts";
export type {
  OnchainosOptions,
  OnchainosAddress,
  WalletStatus,
  WalletLoginReq,
  WalletLoginResult,
  WalletVerifyResult,
  WalletBalanceReq,
  X402SignReq,
  X402SignResult,
  MppChargeReq,
  MppChargeResult,
  DefaultAsset
} from "./settlement/onchainos.ts";

export { toBaseUnits, formatBaseUnits, MONEY_SCALE } from "./money.ts";

export { runLogin } from "./access/login.ts";
export type { AuthMode } from "./access/login.ts";
export { ensureAccessToken } from "./access/token.ts";
export { loadCredentials, saveCredentials, clearCredentials } from "./access/credentials.ts";
export type { SavedCredentials } from "./access/credentials.ts";
