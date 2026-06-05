# Getting Started

Goal: install xpense, construct a client, and emit a Payment Intent in the default `dry-run` mode (nothing settles).

## Steps

1. **Install** — `npm install @xagent/xpense` (Node `>=18.17`, ESM).
2. **Construct** — `new Xpense({ actor, budget })`. Default `mode` is `dry-run`.
3. **Emit** — call `xpense.emit(draft)`; it builds, governs, and records the intent.
4. **Inspect** — read `intent` and `submit.status` (`"dry_run"`).
5. **Next** — go live in [Settle via xerpaai-go](./settle-via-xerpaai-go.md).

```ts
import { Xpense } from "@xagent/xpense";

const xpense = new Xpense({
  actor: "research-agent",
  budget: { daily: { amount: "50", currency: "USDC" } }
});

const { intent, submit } = await xpense.emit({
  reason: { category: "api", description: "Weather data API call" },
  counterparty: { kind: "api", name: "weatherapi.com" },
  amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});

submit.status; // "dry_run"
```

See [Xpense facade](../docs/facade/xpense.md).
