# Why Xpense

Xpense turns "an agent wants to spend money" into a **validated, budget-checked, auditable Payment Intent** before anything settles.

## What it solves

- Money is never a JS float — amounts are decimal strings at the boundary, `bigint` (via `viem`) for arithmetic.
- Every spend passes a policy engine — per-transaction / daily / total budgets, per currency.
- Every intent carries an audit trail and a lifecycle state machine.
- Nothing settles unless `mode = live`. `dry-run` (default) and `mock` simulate.

## What it is not

Xpense is a **thin, typed client**. It does not:

- Hold private keys or custody funds — that is xerpaai-go.
- Sign transactions or re-implement on-chain logic — settlement is delegated to xerpaai-go `/user/onchainos/*`.
- Own the agent loop — it emits intents; it does not lock into any agent framework.

## The moat: governance as its own layer

Best-in-class agentic-payment designs carry only a spend cap in their delegation token. Xpense isolates `governance/` as a first-class layer: budget gate + approval + revoke, abstracted so "needs approver Y above amount X" is expressible.
