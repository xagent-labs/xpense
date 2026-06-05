import { describe, it, expect } from "vitest";
import { PaymentSession } from "../../src/agent/ledger.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function pi(amount: string, currency = "USDC"): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_S",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "api", name: "x" },
    amount: { kind: "fixed", value: { amount, currency } },
    approval: { mode: "auto" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] }
  };
}

describe("PaymentSession.total", () => {
  it("B1: sums amounts without float drift", () => {
    const session = new PaymentSession("sess_x");
    session.record(pi("0.1"));
    session.record(pi("0.2"));
    expect(session.total("USDC")).toBe("0.3");
  });

  it("B1: isolates totals by currency", () => {
    const session = new PaymentSession("sess_x");
    session.record(pi("1", "USDC"));
    session.record(pi("2", "DAI"));
    expect(session.total("USDC")).toBe("1");
  });
});
