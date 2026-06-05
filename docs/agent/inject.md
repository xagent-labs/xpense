# buildInjection

Framework-agnostic hook for gating an agent's pending tool calls through a payment resolver. You supply `resolvePayment`; the injection exposes `onPendingTool` returning `"allow" | "deny"`.

```ts
buildInjection(opts: InjectOptions, toolContext?: Record<string, unknown>): AgentInjection
```

## Types

```ts
interface PendingToolCall {
  tool: string;
  args: unknown;
}
type PendingDecision = "allow" | "deny";
interface PaymentResolution {
  intent: PaymentIntent | null;
  decision: PendingDecision;
}
interface InjectOptions {
  resolvePayment: (call: PendingToolCall) => Promise<PaymentResolution>;
}
interface AgentInjection {
  onPendingTool: (call: PendingToolCall) => Promise<PendingDecision>;
  toolContext: Record<string, unknown>;
}
```

## Example

```ts
import { buildInjection } from "@xagent/xpense";

const injection = buildInjection({
  resolvePayment: async (call) => {
    const { intent } = await xpense.emit(/* derived from call.args */);
    return { intent, decision: "allow" };
  }
});

const decision = await injection.onPendingTool({ tool: "search", args: {} });
```
