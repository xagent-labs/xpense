import { describe, it, expect } from "vitest";
import { capabilities, capabilityMap } from "../../src/agent/capabilities.ts";
import { MemoryDefaultStore } from "../../src/agent/default-store.ts";
import { buildFromDraft } from "../../src/intent/builder.ts";
import { validatePaymentIntent } from "../../src/intent/validate.ts";
import type { ToolContext } from "../../src/agent/tooling.ts";

function ctx(): ToolContext {
  return {
    userId: "u",
    mode: "dry-run",
    origin: { agentId: "a" },
    defaults: new MemoryDefaultStore(),
    async emit(draft) {
      const intent = buildFromDraft(draft, "test");
      expect(validatePaymentIntent(intent)).toEqual([]);
      return { intent, submit: { id: intent.id, status: "dry_run" } };
    }
  };
}

describe("capabilities", () => {
  it("registers exactly the xerpaai-go-backed capabilities", () => {
    expect(capabilities.map((c) => c.name)).toEqual([
      "x402.pay",
      "payment.set_default",
      "payment.get_default",
      "payment.unset_default"
    ]);
  });

  it("x402.pay emits a valid Payment Intent", async () => {
    const x402 = await capabilityMap["x402.pay"].call(
      { accepts: { amount: "0.10", currency: "USDC", resource: "r" } },
      ctx()
    );
    expect(x402.paymentIntent).toBeDefined();
    expect(x402.paymentIntent?.amount.value.amount).toBe("0.10");
  });

  it("default store set/get/unset round-trips", async () => {
    const c = ctx();
    await capabilityMap["payment.set_default"].call(
      { defaultAsset: "USDC", caip2: "eip155:8453", address: "0x1" },
      c
    );
    const got = await capabilityMap["payment.get_default"].call({}, c);
    expect((got.data as { defaultAsset: string }).defaultAsset).toBe("USDC");
    await capabilityMap["payment.unset_default"].call({}, c);
    const empty = await capabilityMap["payment.get_default"].call({}, c);
    expect(empty.data).toBeNull();
  });
});
