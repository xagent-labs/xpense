# Inject Xpense into an Agent

Goal: give an agent the ability to spend — either by exposing xpense's tool registry, or by gating the agent's own tool calls through a payment resolver. xpense emits intents; it does not own the agent loop.

## Option A — expose the capability registry

1. `xpense.listCapabilities()` → array of `ToolDefinition` (name, description, JSON `inputSchema`).
2. Register them with your framework (each has a JSON Schema for arg validation).
3. Route calls through `xpense.invoke(name, input, origin)`.

```ts
const tools = xpense.listCapabilities(); // x402.pay, payment.set_default, ...
const result = await xpense.invoke("x402.pay", {
  accepts: { amount: "0.25", currency: "USDC", resource: "/api/inference" }
});
```

## Option B — gate pending tool calls

1. `buildInjection({ resolvePayment })` — your resolver decides per call.
2. The agent calls `injection.onPendingTool(call)` before executing; gets `"allow" | "deny"`.

```ts
import { buildInjection } from "@xagent/xpense";

const injection = buildInjection({
  resolvePayment: async (call) => {
    const { intent } = await xpense.emit(/* derive from call.args */);
    return { intent, decision: "allow" };
  }
});

const decision = await injection.onPendingTool({ tool: "search", args: {} });
```

Reference: [capabilities](../docs/agent/capabilities.md) · [buildInjection](../docs/agent/inject.md) · [tooling types](../docs/agent/tooling.md).
