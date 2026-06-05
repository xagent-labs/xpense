import { paymentIntentId } from "./id.ts";
import { validatePaymentIntent } from "./validate.ts";
import type {
  ApprovalRequirement,
  Counterparty,
  Money,
  PaymentIntent,
  PaymentIntentDraft,
  PaymentReason,
  PolicyConstraints,
  TaskOrigin
} from "./types.ts";

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined || value === null) {
    throw new Error(`missing required field: ${name}`);
  }
  return value;
}

export class PaymentIntentBuilder {
  private reasonValue?: PaymentReason;
  private originValue: TaskOrigin = {};
  private counterpartyValue?: Counterparty;
  private amountValue?: PaymentIntent["amount"];
  private approvalValue?: ApprovalRequirement;
  private policyValue: PolicyConstraints = {};
  private metadataValue?: Record<string, unknown>;

  static for(origin: TaskOrigin): PaymentIntentBuilder {
    const builder = new PaymentIntentBuilder();
    builder.originValue = origin;
    return builder;
  }

  reason(reason: PaymentReason): this {
    this.reasonValue = reason;
    return this;
  }

  payTo(counterparty: Counterparty): this {
    this.counterpartyValue = counterparty;
    return this;
  }

  fixedAmount(money: Money): this {
    this.amountValue = { kind: "fixed", value: money };
    return this;
  }

  spendLimit(money: Money): this {
    this.amountValue = { kind: "limit", value: money };
    return this;
  }

  requireApproval(approval: ApprovalRequirement): this {
    this.approvalValue = approval;
    return this;
  }

  withPolicy(policy: PolicyConstraints): this {
    this.policyValue = policy;
    return this;
  }

  metadata(metadata: Record<string, unknown>): this {
    this.metadataValue = metadata;
    return this;
  }

  build(actor: string): PaymentIntent {
    const now = new Date().toISOString();
    const pi: PaymentIntent = {
      schemaVersion: "1",
      id: paymentIntentId(),
      reason: required(this.reasonValue, "reason"),
      origin: this.originValue,
      counterparty: required(this.counterpartyValue, "counterparty"),
      amount: required(this.amountValue, "amount"),
      approval: this.approvalValue ?? { mode: "policy" },
      policy: this.policyValue,
      audit: {
        createdBy: actor,
        createdAt: now,
        entries: [{ at: now, event: "created", detail: { actor } }]
      },
      metadata: this.metadataValue
    };
    const errors = validatePaymentIntent(pi);
    if (errors.length > 0) {
      throw new Error(`invalid payment intent: ${errors.join("; ")}`);
    }
    return pi;
  }
}

export function buildFromDraft(draft: PaymentIntentDraft, actor: string): PaymentIntent {
  const builder = PaymentIntentBuilder.for(draft.origin ?? {});
  builder.reason(draft.reason);
  builder.payTo(draft.counterparty);
  if (draft.amount.kind === "fixed") {
    builder.fixedAmount(draft.amount.value);
  } else {
    builder.spendLimit(draft.amount.value);
  }
  builder.requireApproval(draft.approval);
  builder.withPolicy(draft.policy);
  if (draft.metadata) {
    builder.metadata(draft.metadata);
  }
  return builder.build(actor);
}
