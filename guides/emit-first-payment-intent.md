# Emit Your First Payment Intent

Goal: understand what `emit()` does by walking the build → govern → record pipeline, with and without the facade.

## Via the facade (recommended)

1. Construct `Xpense` with a budget.
2. Call `emit(draft)` — one call covers build + governance + ledger.
3. Handle the three failure shapes: `BudgetExceededError`, `requires human approval` Error, settlement throw (auto-revoked).

```ts
try {
  const { intent, submit } = await xpense.emit(draft);
} catch (e) {
  // BudgetExceededError → over limit
  // Error "requires human approval" → needs an approver
}
```

## Building by hand

Use this when you want to inspect/validate before governance.

1. `PaymentIntentBuilder.for(origin)` → chain setters → `.build(actor)`.
2. `validatePaymentIntent(pi)` returns `[]` when valid (build already validates).
3. Pass to `xpense.submitPaymentIntent(pi)` to govern + submit.

```ts
import { PaymentIntentBuilder, validatePaymentIntent } from "@xagent/xpense";

const pi = PaymentIntentBuilder.for({ agentId: "agent-1", goal: "buy dataset" })
  .reason({ category: "data", description: "Dataset license" })
  .payTo({ kind: "merchant", name: "Acme Data" })
  .fixedAmount({ amount: "12.50", currency: "USDC" })
  .withPolicy({ allowedCurrencies: ["USDC"] })
  .build("agent-1");

validatePaymentIntent(pi); // []
await xpense.submitPaymentIntent(pi);
```

Reference: [Builder](../docs/intent/builder.md) · [validate](../docs/intent/validate.md) · [lifecycle](../docs/intent/lifecycle.md).
