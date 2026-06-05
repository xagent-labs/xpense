import { describe, it, expect } from "vitest";
import { GovernanceGate } from "../../src/governance/gate.ts";
import { PolicyEngine } from "../../src/governance/policy.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function pi(amount: string, over: Partial<PaymentIntent> = {}): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_G",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "api", name: "x" },
    amount: { kind: "fixed", value: { amount, currency: "USDC" } },
    approval: { mode: "policy" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] },
    ...over
  };
}

describe("GovernanceGate", () => {
  it("authorizes within budget when no approval is needed", () => {
    const gate = new GovernanceGate(
      new PolicyEngine({ total: { amount: "100", currency: "USDC" } })
    );
    expect(gate.authorize(pi("10")).outcome).toBe("authorized");
  });

  it("rejects an over-budget intent", () => {
    const gate = new GovernanceGate(
      new PolicyEngine({ perTxn: { amount: "5", currency: "USDC" } })
    );
    expect(gate.authorize(pi("10")).outcome).toBe("rejected");
  });

  it("requires approval for human mode without consuming budget", () => {
    const policy = new PolicyEngine({ total: { amount: "100", currency: "USDC" } });
    const gate = new GovernanceGate(policy);
    expect(gate.authorize(pi("10", { approval: { mode: "human" } })).outcome).toBe(
      "requires_approval"
    );
    expect(policy.spent("USDC").total).toBe(0n);
  });

  it("revoke releases a reservation", () => {
    const gate = new GovernanceGate(
      new PolicyEngine({ total: { amount: "10", currency: "USDC" } })
    );
    gate.authorize(pi("6"));
    gate.revoke(pi("6"));
    expect(gate.authorize(pi("6")).outcome).toBe("authorized");
  });
});
