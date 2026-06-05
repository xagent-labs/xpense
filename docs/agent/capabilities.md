# capabilities / capabilityMap

The agent tool registry — one tool definition per spend action, ready to expose to any agent framework. `Xpense.invoke(name, input)` dispatches through `capabilityMap`.

```ts
const capabilities: ToolDefinition[];
const capabilityMap: Record<string, ToolDefinition>;
```

## Registered tools

| Name                    | Read-only | Description                                                                                                             |
| ----------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `x402.pay`              | no        | Emit a Payment Intent for an x402 (HTTP 402) resource; signing/settlement handed downstream to xerpaai-go `/x402/sign`. |
| `payment.set_default`   | no        | Set default payment asset, chain (CAIP-2), and address for the session.                                                 |
| `payment.get_default`   | yes       | Read the current default asset/chain/address.                                                                           |
| `payment.unset_default` | no        | Clear the default.                                                                                                      |

Each tool carries a JSON `inputSchema`. `x402.pay` accepts `{ accepts, from?, tier?, force? }` and `tier: "premium"` maps to `approval.mode = "auto"`.

## ToolDefinition

```ts
interface ToolDefinition {
  name: string;
  description: string;
  isReadOnly: boolean;
  inputSchema: object; // JSON Schema
  call(input: unknown, ctx: ToolContext): Promise<ToolResult>;
}
```

## Example

```ts
const result = await xpense.invoke("x402.pay", {
  accepts: { amount: "0.25", currency: "USDC", resource: "/api/inference" }
});
```
