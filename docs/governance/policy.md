# PolicyEngine / BudgetExceededError

Per-currency budget engine. Tracks spend in `bigint` (via `viem`), enforces per-transaction / daily / total limits **independently per currency**, and resets the daily counter at the UTC day boundary.

> In-process, single-runtime. Its `reserve`/`release` Maps do not coordinate across workers or processes.

## Constructor

```ts
new PolicyEngine(budget?: BudgetSpec, now?: () => number)
```

| Param    | Type           | Description                                   |
| -------- | -------------- | --------------------------------------------- |
| `budget` | `BudgetSpec`   | `{ total?; perTxn?; daily? }`, each a `Money` |
| `now`    | `() => number` | clock injection for testable daily resets     |

## Methods

```ts
evaluate(pi: PaymentIntent): PolicyDecision   // check only, no reservation
reserve(pi: PaymentIntent): PolicyDecision    // check + reserve atomically (preferred)
release(pi: PaymentIntent): void              // roll back a reservation
commit(pi: PaymentIntent): void               // legacy: pair with evaluate, never with reserve
spent(currency: string): { total: bigint; daily: bigint }
```

Use exactly one budget flow per spend: `reserve`→`release` **or** `evaluate`→`commit`. Never pair `reserve`+`commit` — that double-counts.

Over-limit raises `BudgetExceededError` from `check`.

## Example

```ts
import { PolicyEngine, BudgetExceededError } from "@xagent/xpense";

const engine = new PolicyEngine({ daily: { amount: "100", currency: "USDC" } });
try {
  engine.reserve(pi);
} catch (e) {
  if (e instanceof BudgetExceededError) {
    /* over limit */
  }
}
```

## Types

```ts
interface BudgetSpec { total?: Money; perTxn?: Money; daily?: Money }
interface PolicyDecision { allowed: boolean; requiresHumanApproval: boolean }
class BudgetExceededError extends Error  // name = "BudgetExceeded"
```
