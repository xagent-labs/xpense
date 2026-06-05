import { toBaseUnits } from "../money.ts";
import type { PaymentIntent } from "../intent/types.ts";

export interface ApprovalDecision {
  required: boolean;
  reason?: string;
}

export function approvalDecision(pi: PaymentIntent): ApprovalDecision {
  if (pi.approval.mode === "human") {
    return { required: true, reason: "approval.mode is human" };
  }
  const threshold = pi.governance?.requiresApprovalAbove;
  if (threshold) {
    const money = pi.amount.value;
    if (
      money.currency === threshold.currency &&
      toBaseUnits(money.amount) > toBaseUnits(threshold.amount)
    ) {
      return {
        required: true,
        reason: `amount ${money.amount} ${money.currency} exceeds approval threshold ${threshold.amount}`
      };
    }
  }
  return { required: false };
}
