import { describe, it, expect } from "vitest";
import { validatePaymentIntent, isDecimalString } from "../../src/intent/validate.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function base(): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_X",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "merchant", name: "v" },
    amount: { kind: "fixed", value: { amount: "1.00", currency: "USD" } },
    approval: { mode: "auto" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] }
  };
}

describe("validatePaymentIntent", () => {
  it("accepts a valid PI", () => {
    expect(validatePaymentIntent(base())).toEqual([]);
  });

  it("rejects float (number) amount", () => {
    const pi = base();
    (pi.amount.value as { amount: unknown }).amount = 12.5;
    expect(validatePaymentIntent(pi).some((e) => e.includes("decimal"))).toBe(true);
  });

  it("rejects missing currency", () => {
    const pi = base();
    pi.amount.value.currency = "";
    expect(validatePaymentIntent(pi).some((e) => e.includes("currency"))).toBe(true);
  });

  it("rejects currency not in allowedCurrencies", () => {
    const pi = base();
    pi.policy.allowedCurrencies = ["EUR"];
    expect(validatePaymentIntent(pi).some((e) => e.includes("allowedCurrencies"))).toBe(true);
  });
});

describe("isDecimalString", () => {
  it("accepts decimal strings, rejects numbers and junk", () => {
    expect(isDecimalString("1.00")).toBe(true);
    expect(isDecimalString("42")).toBe(true);
    expect(isDecimalString(1.5)).toBe(false);
    expect(isDecimalString("abc")).toBe(false);
    expect(isDecimalString("")).toBe(false);
  });
});
