import { describe, it, expect, vi } from "vitest";
import { Xpense } from "../../src/agent/xpense.ts";
import { buildInjection, type PendingToolCall } from "../../src/agent/inject.ts";

describe("agent injection e2e", () => {
  it("onPendingTool emits PI through policy + dry-run, no real fetch", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const xp = new Xpense({
      mode: "dry-run",
      budget: { total: { amount: "200", currency: "USDC" } }
    });

    const emitted: string[] = [];
    const injection = buildInjection({
      async resolvePayment(call) {
        const result = await xp.invoke(call.tool, call.args, { agentId: "a42" });
        const intent = result.paymentIntent ?? null;
        if (intent) {
          emitted.push(intent.id);
        }
        return { intent, decision: "allow" };
      }
    });

    const calls: PendingToolCall[] = [
      { tool: "x402.pay", args: { accepts: { amount: "50", currency: "USDC", resource: "r1" } } },
      { tool: "x402.pay", args: { accepts: { amount: "0.1", currency: "USDC", resource: "r2" } } }
    ];
    for (const call of calls) {
      expect(await injection.onPendingTool(call)).toBe("allow");
    }

    expect(emitted.length).toBe(2);
    expect(xp.pendingSession().length).toBe(2);
    expect(spy).not.toHaveBeenCalled();
    vi.restoreAllMocks();
  });

  it("budget overflow surfaces BudgetExceeded through invoke", async () => {
    const xp = new Xpense({
      mode: "dry-run",
      budget: { total: { amount: "60", currency: "USDC" } }
    });
    await xp.invoke(
      "x402.pay",
      { accepts: { amount: "50", currency: "USDC", resource: "r1" } },
      { agentId: "a" }
    );
    await expect(
      xp.invoke(
        "x402.pay",
        { accepts: { amount: "50", currency: "USDC", resource: "r2" } },
        { agentId: "a" }
      )
    ).rejects.toThrow(/budget/);
  });
});
