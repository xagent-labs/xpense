export interface Money {
  amount: string;
  currency: string;
}

export interface PaymentReason {
  category: string;
  description: string;
}

export interface TaskOrigin {
  workflowId?: string;
  taskId?: string;
  goal?: string;
  agentId?: string;
}

export type CounterpartyKind = "merchant" | "api" | "saas" | "agent" | "address";

export interface Counterparty {
  kind: CounterpartyKind;
  name: string;
  identifiers?: Record<string, string>;
}

export type AmountSpec = { kind: "fixed"; value: Money } | { kind: "limit"; value: Money };

export type ApprovalMode = "auto" | "human" | "policy";

export interface ApprovalRequirement {
  mode: ApprovalMode;
  reason?: string;
}

export interface PolicyConstraints {
  perTxnLimit?: Money;
  dailyLimit?: Money;
  allowedCurrencies?: string[];
  expiresAt?: string;
  tags?: string[];
}

export interface AuditEntry {
  at: string;
  event: string;
  detail?: Record<string, unknown>;
}

export interface AuditTrail {
  createdBy: string;
  createdAt: string;
  entries: AuditEntry[];
}

export interface IntentDeclaration {
  text: string;
  humanPresent: boolean;
}

export interface AllowanceScope {
  reason: "one_time" | "recurring";
  maxAmount: string;
  currency: string;
  merchantId?: string;
  expiresAt?: string;
}

export interface GovernanceConstraints {
  budgetId?: string;
  approver?: string;
  requiresApprovalAbove?: Money;
}

export interface MandateRefs {
  intentHash?: string;
  cartHash?: string;
  paymentHash?: string;
}

export type PaymentIntentStatus =
  | "pending"
  | "authorized"
  | "executing"
  | "settled"
  | "failed"
  | "revoked";

export type SettlementScheme = "exact" | "voucher" | "stream";

export interface PaymentIntent {
  schemaVersion: "1";
  id: string;
  reason: PaymentReason;
  origin: TaskOrigin;
  counterparty: Counterparty;
  amount: AmountSpec;
  approval: ApprovalRequirement;
  policy: PolicyConstraints;
  audit: AuditTrail;
  metadata?: Record<string, unknown>;
  status?: PaymentIntentStatus;
  intent?: IntentDeclaration;
  allowance?: AllowanceScope;
  governance?: GovernanceConstraints;
  mandate?: MandateRefs;
  network?: string;
  scheme?: SettlementScheme;
}

export type PaymentIntentDraft = Omit<
  PaymentIntent,
  "schemaVersion" | "id" | "audit" | "origin"
> & {
  id?: string;
  origin?: TaskOrigin;
  audit?: Partial<AuditTrail>;
};

export type PaymentIntentMode = "live" | "dry-run" | "mock";

export interface SubmitResult {
  id: string;
  status: "emitted" | "dry_run" | "mock";
  raw?: unknown;
}
