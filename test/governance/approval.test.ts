import { describe, it, expect } from "vitest";
import { approvalDecision } from "../../src/governance/approval.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function pi(over: Partial<PaymentIntent>): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_A",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "api", name: "x" },
    amount: { kind: "fixed", value: { amount: "10", currency: "USDC" } },
    approval: { mode: "policy" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] },
    ...over
  };
}

describe("approvalDecision", () => {
  it("requires approval for human mode", () => {
    expect(approvalDecision(pi({ approval: { mode: "human" } })).required).toBe(true);
  });

  it("requires approval above the governance threshold", () => {
    const d = approvalDecision(
      pi({ governance: { requiresApprovalAbove: { amount: "5", currency: "USDC" } } })
    );
    expect(d.required).toBe(true);
  });

  it("allows amounts at or under the threshold", () => {
    const d = approvalDecision(
      pi({ governance: { requiresApprovalAbove: { amount: "20", currency: "USDC" } } })
    );
    expect(d.required).toBe(false);
  });

  it("does not require approval by default", () => {
    expect(approvalDecision(pi({})).required).toBe(false);
  });
});
