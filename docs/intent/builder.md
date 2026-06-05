# PaymentIntentBuilder / buildFromDraft

Fluent construction of a `PaymentIntent`. `build()` runs `validatePaymentIntent` and throws on any error, so a returned intent is always valid.

## PaymentIntentBuilder

```ts
PaymentIntentBuilder.for(origin: TaskOrigin): PaymentIntentBuilder
```

Chainable setters (each returns `this`):

```ts
reason(reason: PaymentReason): this
payTo(counterparty: Counterparty): this
fixedAmount(money: Money): this           // amount.kind = "fixed"
spendLimit(money: Money): this            // amount.kind = "limit"
requireApproval(approval: ApprovalRequirement): this
withPolicy(policy: PolicyConstraints): this
metadata(metadata: Record<string, unknown>): this
build(actor: string): PaymentIntent       // validates; throws if invalid
```

Defaults applied at `build`: `schemaVersion = "1"`, `approval = { mode: "policy" }` when unset, generated `pi_…` id, and an audit entry `{ event: "created" }`.

### Example

```ts
import { PaymentIntentBuilder } from "@xagent/xpense";

const pi = PaymentIntentBuilder.for({ agentId: "agent-1", goal: "buy dataset" })
  .reason({ category: "data", description: "Dataset license" })
  .payTo({ kind: "merchant", name: "Acme Data" })
  .fixedAmount({ amount: "12.50", currency: "USDC" })
  .withPolicy({ allowedCurrencies: ["USDC"] })
  .build("agent-1");
```

## buildFromDraft

```ts
buildFromDraft(draft: PaymentIntentDraft, actor: string): PaymentIntent
```

Convenience wrapper that drives the builder from a flat `PaymentIntentDraft`. This is what `Xpense.createPaymentIntent` calls internally.

| Param   | Type                 | Description                   |
| ------- | -------------------- | ----------------------------- |
| `draft` | `PaymentIntentDraft` | flat description of the spend |
| `actor` | `string`             | audit `createdBy`             |
