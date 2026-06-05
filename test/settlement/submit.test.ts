import { describe, it, expect, vi, afterEach } from "vitest";
import { submitPaymentIntent } from "../../src/settlement/submit.ts";
import type { PaymentIntent } from "../../src/intent/types.ts";

function pi(): PaymentIntent {
  return {
    schemaVersion: "1",
    id: "pi_T",
    reason: { category: "c", description: "d" },
    origin: {},
    counterparty: { kind: "api", name: "x" },
    amount: { kind: "fixed", value: { amount: "1", currency: "USDC" } },
    approval: { mode: "auto" },
    policy: {},
    audit: { createdBy: "a", createdAt: "t", entries: [] }
  };
}

describe("submitPaymentIntent", () => {
  afterEach(() => vi.restoreAllMocks());

  it("dry-run does not call fetch", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await submitPaymentIntent(pi(), {
      mode: "dry-run",
      baseUrl: "https://x",
      endpoint: "/e"
    });
    expect(res.status).toBe("dry_run");
    expect(spy).not.toHaveBeenCalled();
  });

  it("mock does not call fetch", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const res = await submitPaymentIntent(pi(), {
      mode: "mock",
      baseUrl: "https://x",
      endpoint: "/e"
    });
    expect(res.status).toBe("mock");
    expect(spy).not.toHaveBeenCalled();
  });
});
