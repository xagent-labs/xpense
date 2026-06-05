import type { PaymentDefault, ToolDefinition } from "./tooling.ts";

interface X402PayInput {
  accepts: unknown;
  from?: string;
  tier?: "basic" | "premium";
  force?: boolean;
}

const x402Pay: ToolDefinition = {
  name: "x402.pay",
  description:
    "Emit a Payment Intent for an x402 (HTTP 402) resource. Signing and settlement are handed off downstream to the xerpaai-go /x402/sign endpoint.",
  isReadOnly: false,
  inputSchema: {
    type: "object",
    properties: {
      accepts: { type: "object" },
      from: { type: "string" },
      tier: { type: "string", enum: ["basic", "premium"] },
      force: { type: "boolean" }
    },
    required: ["accepts"]
  },
  async call(input, ctx) {
    const inp = input as X402PayInput;
    const accepts = (inp.accepts ?? {}) as {
      amount?: string;
      currency?: string;
      resource?: string;
    };
    const amount = accepts.amount ?? "0";
    const currency = accepts.currency ?? "USDC";
    const { intent, submit } = await ctx.emit({
      reason: {
        category: "x402",
        description: `x402 payment${accepts.resource ? ` for ${accepts.resource}` : ""}`
      },
      origin: ctx.origin,
      counterparty: {
        kind: "api",
        name: accepts.resource ?? "x402-resource",
        identifiers: inp.from ? { from: inp.from } : {}
      },
      amount: { kind: "fixed", value: { amount, currency } },
      approval: { mode: inp.tier === "premium" ? "auto" : "policy" },
      policy: {}
    });
    return { data: { signed: false, intent: intent.id }, paymentIntent: intent, submit };
  }
};

const setDefault: ToolDefinition = {
  name: "payment.set_default",
  description: "Set the default payment asset, chain (CAIP-2) and address for this session.",
  isReadOnly: false,
  inputSchema: {
    type: "object",
    properties: {
      defaultAsset: { type: "string" },
      caip2: { type: "string" },
      address: { type: "string" }
    },
    required: ["defaultAsset", "caip2", "address"]
  },
  async call(input, ctx) {
    const value = input as PaymentDefault;
    ctx.defaults.set(value);
    return { data: value };
  }
};

const getDefault: ToolDefinition = {
  name: "payment.get_default",
  description: "Read the current default payment asset/chain/address.",
  isReadOnly: true,
  inputSchema: { type: "object", properties: {} },
  async call(_input, ctx) {
    return { data: ctx.defaults.get() };
  }
};

const unsetDefault: ToolDefinition = {
  name: "payment.unset_default",
  description: "Clear the default payment asset/chain/address.",
  isReadOnly: false,
  inputSchema: { type: "object", properties: {} },
  async call(_input, ctx) {
    ctx.defaults.unset();
    return { data: {} };
  }
};

export const capabilities: ToolDefinition[] = [x402Pay, setDefault, getDefault, unsetDefault];

export const capabilityMap: Record<string, ToolDefinition> = Object.fromEntries(
  capabilities.map((cap) => [cap.name, cap])
);
