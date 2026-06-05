import { describe, it, expect } from "vitest";
import { PaymentIntentBuilder, buildFromDraft } from "../../src/intent/builder.ts";

describe("PaymentIntentBuilder", () => {
  it("builds a PI with all field groups, ulid id, and audit", () => {
    const pi = PaymentIntentBuilder.for({ goal: "buy data", agentId: "a1" })
      .reason({ category: "data", description: "dataset" })
      .payTo({ kind: "merchant", name: "vendor" })
      .spendLimit({ amount: "50.00", currency: "USD" })
      .requireApproval({ mode: "auto" })
      .withPolicy({ allowedCurrencies: ["USD"] })
      .build("tester");

    expect(pi.reason.description).toBe("dataset");
    expect(pi.origin.agentId).toBe("a1");
    expect(pi.counterparty.name).toBe("vendor");
    expect(pi.amount).toEqual({ kind: "limit", value: { amount: "50.00", currency: "USD" } });
    expect(pi.approval.mode).toBe("auto");
    expect(pi.policy.allowedCurrencies).toEqual(["USD"]);
    expect(pi.id).toMatch(/^pi_[0-9A-Z]{26}$/);
    expect(pi.audit.createdBy).toBe("tester");
    expect(pi.audit.entries.length).toBe(1);
  });

  it("generates unique ids", () => {
    const draft = {
      reason: { category: "c", description: "d" },
      counterparty: { kind: "api" as const, name: "x" },
      amount: { kind: "fixed" as const, value: { amount: "1", currency: "USDC" } },
      approval: { mode: "auto" as const },
      policy: {}
    };
    const a = buildFromDraft(draft, "actor");
    const b = buildFromDraft(draft, "actor");
    expect(a.id).not.toBe(b.id);
  });

  it("throws on missing required field", () => {
    expect(() => PaymentIntentBuilder.for({}).build("x")).toThrow(/reason/);
  });
});
