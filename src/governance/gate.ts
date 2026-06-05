import type { PaymentIntent } from "../intent/types.ts";
import { approvalDecision } from "./approval.ts";
import { BudgetExceededError, PolicyEngine } from "./policy.ts";

export type GovernanceOutcome = "authorized" | "requires_approval" | "rejected";

export interface GovernanceDecision {
  outcome: GovernanceOutcome;
  requiresApproval: boolean;
  reason?: string;
}

export class GovernanceGate {
  constructor(private readonly policy: PolicyEngine) {}

  authorize(pi: PaymentIntent): GovernanceDecision {
    const approval = approvalDecision(pi);
    if (approval.required) {
      return { outcome: "requires_approval", requiresApproval: true, reason: approval.reason };
    }
    try {
      this.policy.reserve(pi);
    } catch (err) {
      if (err instanceof BudgetExceededError) {
        return { outcome: "rejected", requiresApproval: false, reason: err.message };
      }
      throw err;
    }
    return { outcome: "authorized", requiresApproval: false };
  }

  revoke(pi: PaymentIntent): void {
    this.policy.release(pi);
  }
}
