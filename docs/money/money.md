# Money

Exact money helpers built on `viem`'s `parseUnits` / `formatUnits`. Decimal strings at the boundary, `bigint` for all arithmetic. `number` is forbidden for money.

```ts
const MONEY_SCALE = 18;

toBaseUnits(amount: string): bigint        // "12.50" → 12500000000000000000n
formatBaseUnits(value: bigint): string     // bigint → decimal string
```

`toBaseUnits` throws a clear error on an invalid amount string.

## Example

```ts
import { toBaseUnits, formatBaseUnits } from "@xagent/xpense";

toBaseUnits("0.1") + toBaseUnits("0.2"); // exact, no float drift
formatBaseUnits(toBaseUnits("12.50")); // "12.5"
```

Everything in `governance/` and the session ledger routes money through these — never `Number()` an amount.
