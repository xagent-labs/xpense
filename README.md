# @xagent/xpense — Agentic Payments SDK for TypeScript

[![npm version](https://img.shields.io/npm/v/@xagent/xpense)](https://www.npmjs.com/package/@xagent/xpense)
[![npm downloads](https://img.shields.io/npm/dm/@xagent/xpense)](https://www.npmjs.com/package/@xagent/xpense)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)](https://www.typescriptlang.org/)
[![ESM only](https://img.shields.io/badge/module-ESM-f7df1e)](https://nodejs.org/api/esm.html)
[![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#license)

**Xpense is a TypeScript SDK for agentic payments** — it lets an AI agent spend money safely. Give an agent **spending limits** (per-transaction, daily and total budgets, per currency), require **human approval** above a threshold, and turn every "the agent wants to pay" moment into a validated, auditable **Payment Intent** before anything settles. Xpense is the **governance + intent layer**: protocol-agnostic, it never holds keys, and it settles through an on-chain API (HTTP **x402** / machine payments) on **X Layer**. Amounts are exact integers via [`viem`](https://viem.sh) — never floats.

```
 agent ──emit──▶  Payment Intent  ──▶  Governance  ──▶  Settlement
                  typed · audited       budget + approval     x402 / mpp · X Layer
                                        keys never reach the model
```

> The model **proposes** a spend. Your **policy** decides. xerpaai-go **settles**. The agent never touches a key.

— [Install](#install) · [Quick start](#quick-start) · [Payment Intents](#payment-intents) · [Budgets & governance](#budgets--governance) · [Settlement](#settlement-on-x-layer) · [Pay-on-402](#pay-on-402) · [CLI](#cli) · [Try it locally](#try-it-locally) · [Docs](#docs)

## Install

```sh
npm install @xagent/xpense
```

Requires Node `>=18.17`. ESM only.

## Quick start

```ts
import { Xpense } from "@xagent/xpense";

const xpense = new Xpense({
  actor: "research-agent",
  budget: {
    perTxn: { amount: "5", currency: "USDC" },
    daily: { amount: "50", currency: "USDC" },
    total: { amount: "500", currency: "USDC" }
  }
});

await xpense.login(); // browser / device / paste OAuth against XAgent

const { intent, submit } = await xpense.emit({
  reason: { category: "api", description: "Weather data API call" },
  counterparty: { kind: "api", name: "weatherapi.com" },
  amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});
```

`emit()` builds the intent, runs it through the governance gate (budget + approval), and records it. By default `mode` is `dry-run` — nothing settles. Real settlement is an explicit step through the gateway (below).

## Payment Intents

Every spend is a typed, auditable Payment Intent — never a raw transaction. Build and validate them directly:

```ts
import { PaymentIntentBuilder, validatePaymentIntent } from "@xagent/xpense";

const pi = PaymentIntentBuilder.for({ agentId: "agent-1", goal: "buy dataset" })
  .reason({ category: "data", description: "Dataset license" })
  .payTo({ kind: "merchant", name: "Acme Data" })
  .fixedAmount({ amount: "12.50", currency: "USDC" })
  .withPolicy({ allowedCurrencies: ["USDC"] })
  .build("agent-1");

const errors = validatePaymentIntent(pi); // [] when valid
```

Amounts are **decimal strings** (`"12.50"`), never JS numbers — precision is preserved across currencies and on-chain tokens. A lifecycle state machine guards status transitions:

```
pending → authorized → executing → settled | failed | revoked
```

## Budgets & governance

`PolicyEngine` enforces per-transaction / daily / total limits **per currency** with exact integer math; `GovernanceGate` layers approval + revoke on top:

```ts
import { PolicyEngine, GovernanceGate, BudgetExceededError } from "@xagent/xpense";

const gate = new GovernanceGate(new PolicyEngine({ daily: { amount: "100", currency: "USDC" } }));

const decision = gate.authorize(pi); // "authorized" | "rejected" | "requires_approval"
// ...on settlement failure:
gate.revoke(pi); // roll the reservation back
```

- `reserve()` checks and reserves atomically — safe when multiple agents settle in parallel.
- Limits are tracked **independently per currency**; the daily counter resets at the UTC day boundary.
- Over-limit raises `BudgetExceededError`; human-mode or above-threshold intents return `requires_approval` without consuming budget.

This governance layer is the point of xpense: spending limits, approval chains and audit trails that the settlement rails themselves don't give you.

## Settlement on X Layer

xpense is a thin, typed client over the xerpaai-go `/user/onchainos/*` API. It calls that API to settle on **X Layer**; it does not sign transactions or hold keys.

```ts
const gw = await xpense.gateway(); // typed client, JWT from login()

await gw.walletStatus();
await gw.x402Sign({ accepts, resource: "/api/inference" }); // HTTP-402 settlement
await gw.mppCharge({ challenge }); // machine-payment deduction
```

Covered endpoints: `wallet/{status,login,verify,addresses,balance,logout}`, `x402/sign`, `mpp/charge`, `default-asset/{get,set,unset}`. Anything the backend has not implemented is **not** stubbed here.

## Pay-on-402

Wrap `fetch` to react to HTTP `402 Payment Required` challenges:

```ts
import { createPayFetch } from "@xagent/xpense";

const payFetch = createPayFetch({
  onPaymentRequired: async (challenge, { url }) => {
    // emit a Payment Intent, then settle via gateway.x402Sign(...)
  }
});
```

## CLI

```sh
xpense login                                   # authenticate (loopback | device | paste)
xpense bench --amount 2 --budget 1             # mock a spend, see the governance decision
xpense bench                                   # no flags → interactive
```

`bench` is flag-first so agents and scripts can drive it; with no flags it drops into an interactive prompt.

## Try it locally

Three mock surfaces — nothing real moves, no login required:

```sh
npm run welcome:ui     # landing page            → http://localhost:4700
npm run test:ui        # emit test bench         → http://localhost:4500
npm run accounts:ui    # account console         → http://localhost:4600
```

Scenario scripts (run and read the output):

```sh
npm run example:governance    # budget reject + approval gate, three outcomes
npm run example:settlement    # the exact payloads xpense sends to xerpaai-go
```

## Auth

`login(mode)` supports `"loopback"` (default browser), `"device"`, and `"paste"` OAuth flows against XAgent. Credentials are stored at `~/.config/xagent/credentials.json` (mode `0600`; `%APPDATA%\xagent` on Windows) and access tokens auto-refresh.

## Configuration

| Env                    | Default                   | Purpose                       |
| ---------------------- | ------------------------- | ----------------------------- |
| `XAGENT_API_BASE`      | `https://api.xerpaai.com` | xerpaai-go API base           |
| `XAGENT_FRONTEND_BASE` | `https://www.xerpaai.com` | OAuth login frontend          |
| `XAGENT_PI_MODE`       | `dry-run`                 | `live` \| `dry-run` \| `mock` |

## Docs

- [`docs/`](./docs) — API reference, one page per export, grouped by layer.
- [`guides/`](./guides) — task-oriented walkthroughs (getting started, budgets, settlement, agent injection).
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — the layered blueprint and where xpense sits in the agent payment stack.

## Scripts

| Command          | Purpose                          |
| ---------------- | -------------------------------- |
| `npm run build`  | `tsc` → `dist/`                  |
| `npm run lint`   | type-check (`tsc --noEmit`)      |
| `npm test`       | vitest unit suite                |
| `npm run e2e`    | playwright gateway-payload check |
| `npm run format` | prettier                         |

## License

Proprietary — © XAgent. All rights reserved.
