import { describe, it, expect } from "vitest";
import { Xpense } from "../../src/agent/xpense.ts";
import type { PaymentIntentDraft } from "../../src/intent/types.ts";

function draft(amount: string): PaymentIntentDraft {
  return {
    reason: { category: "api", description: "test" },
    counterparty: { kind: "api", name: "svc" },
    amount: { kind: "fixed", value: { amount, currency: "USDC" } },
    approval: { mode: "auto" },
    policy: {}
  };
}

describe("Xpense budget x mode", () => {
  it("dry-run accumulates spend so a simulation surfaces the limit", async () => {
    const xp = new Xpense({
      mode: "dry-run",
      budget: { total: { amount: "1", currency: "USDC" } }
    });
    await expect(xp.emit(draft("0.6"))).resolves.toMatchObject({ submit: { status: "dry_run" } });
    await expect(xp.emit(draft("0.6"))).rejects.toThrow(/budget/);
  });

  it("surfaces an over-budget intent before submit", async () => {
    const xp = new Xpense({
      mode: "dry-run",
      budget: { perTxn: { amount: "1", currency: "USDC" } }
    });
    await expect(xp.emit(draft("2"))).rejects.toThrow(/per-transaction/);
  });
});

describe("Xpense mock mode", () => {
  it("emits a Payment Intent and echoes it without real creds or fetch", async () => {
    const xp = new Xpense({ mode: "mock" });
    const result = await xp.emit(draft("1"));
    expect(result.submit.status).toBe("mock");
    expect(result.intent.amount.value.amount).toBe("1");
    expect(xp.pendingSession().length).toBe(1);
  });
});
