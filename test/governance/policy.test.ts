import { describe, it, expect } from "vitest";
import { PolicyEngine, BudgetExceededError } from "../../src/governance/policy.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function pi(amount: string): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_P",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "api", name: "x" },
    amount: { kind: "fixed", value: { amount, currency: "USDC" } },
    approval: { mode: "auto" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] }
  };
}

function piCur(amount: string, currency: string): PaymentIntent {
  const base = pi(amount);
  return { ...base, amount: { kind: "fixed", value: { amount, currency } } };
}

describe("PolicyEngine", () => {
  it("throws BudgetExceeded on the second emit over total", () => {
    const engine = new PolicyEngine({ total: { amount: "100", currency: "USDC" } });
    engine.evaluate(pi("60"));
    engine.commit(pi("60"));
    expect(() => engine.evaluate(pi("60"))).toThrow(BudgetExceededError);
  });

  it("enforces per-transaction limit", () => {
    const engine = new PolicyEngine({ perTxn: { amount: "10", currency: "USDC" } });
    expect(() => engine.evaluate(pi("11"))).toThrow(/per-transaction/);
  });

  it("enforces daily limit across commits", () => {
    const engine = new PolicyEngine({ daily: { amount: "30", currency: "USDC" } });
    engine.evaluate(pi("20"));
    engine.commit(pi("20"));
    expect(() => engine.evaluate(pi("15"))).toThrow(/daily/);
  });

  it("ignores limits in a different currency", () => {
    const engine = new PolicyEngine({ total: { amount: "1", currency: "USD" } });
    expect(engine.evaluate(pi("9999")).allowed).toBe(true);
  });

  it("C1: no float drift — 0.1 + 0.2 fits a 0.3 daily budget", () => {
    const engine = new PolicyEngine({ daily: { amount: "0.3", currency: "USDC" } });
    engine.evaluate(pi("0.1"));
    engine.commit(pi("0.1"));
    expect(() => engine.evaluate(pi("0.2"))).not.toThrow();
  });

  it("C2: a foreign-currency commit does not consume another currency's budget", () => {
    const engine = new PolicyEngine({ daily: { amount: "10", currency: "USDC" } });
    engine.commit(piCur("9999", "DAI"));
    expect(() => engine.evaluate(pi("5"))).not.toThrow();
  });

  it("I2: resets the daily counter on a new day", () => {
    let now = Date.parse("2026-01-01T10:00:00Z");
    const engine = new PolicyEngine({ daily: { amount: "10", currency: "USDC" } }, () => now);
    engine.commit(pi("8"));
    now = Date.parse("2026-01-02T10:00:00Z");
    expect(() => engine.evaluate(pi("8"))).not.toThrow();
  });

  it("I3: reserve atomically prevents TOCTOU double-spend", () => {
    const engine = new PolicyEngine({ total: { amount: "100", currency: "USDC" } });
    engine.reserve(pi("60"));
    expect(() => engine.reserve(pi("60"))).toThrow(BudgetExceededError);
  });

  it("I3: release rolls back a reservation", () => {
    const engine = new PolicyEngine({ total: { amount: "100", currency: "USDC" } });
    engine.reserve(pi("60"));
    engine.release(pi("60"));
    expect(() => engine.reserve(pi("60"))).not.toThrow();
  });
});
