# Agent Tooling Types

Type-only exports from `agent/tooling.ts` — the contract between capabilities and the facade.

| Type                  | Shape (summary)                                                              |
| --------------------- | ---------------------------------------------------------------------------- |
| `ToolDefinition`      | `{ name; description; isReadOnly; inputSchema; call(input, ctx) }`           |
| `ToolContext`         | `{ userId; mode; origin; defaults; emit(draft) }` injected into every `call` |
| `ToolResult`          | `{ data; paymentIntent?; submit? }`                                          |
| `EmitResult`          | `{ intent: PaymentIntent; submit: SubmitResult }` returned by `Xpense.emit`  |
| `PaymentDefault`      | `{ defaultAsset; caip2; address }`                                           |
| `PaymentDefaultStore` | `get / set / unset` over a `PaymentDefault`                                  |

Outline only — exact field lists live in `src/agent/tooling.ts`.
