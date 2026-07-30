# Xpense Documentation

API reference for `@xagent/xpense` — the Agentic Payment Stack. Every public export from `src/index.ts` is documented here, grouped by the layer it belongs to.

This is reference material (what each class/function is, its signature, parameters, one example). For task-oriented walkthroughs ("how do I emit my first intent", "how do I settle"), see [Guides](../guides/index.md).

## Sidebar

```
Introduction
  Why Xpense
  Installation
  Getting Started          → ../guides/getting-started.md
  Mental Model             (agent → intent → governance → settlement)

Xpense Facade
  Xpense                   the one-stop client
  XpenseOptions
  resolveConfig / XpenseConfig

X-Agent Runtime
  Commerce Runtime            createXAgent · BillingPort · ModelProvider · receipts

Intent
  PaymentIntentBuilder
  buildFromDraft
  validatePaymentIntent / isDecimalString
  Lifecycle                canTransition · transition · isTerminal
  Types                    PaymentIntent · PaymentIntentDraft · Money · …

Governance
  PolicyEngine             per-currency bigint budget engine
  BudgetExceededError
  GovernanceGate
  approvalDecision
  Types                    BudgetSpec · PolicyDecision · GovernanceDecision

Settlement
  OnchainosGateway         typed client over xerpaai-go /user/onchainos/*
  submitPaymentIntent
  createPayFetch           HTTP-402 fetch wrapper
  Types                    X402SignReq · MppChargeReq · WalletStatus · …

Agent
  capabilities / capabilityMap   the agent tool registry
  buildInjection           framework-agnostic tool gating
  PaymentSession           in-session ledger
  MemoryDefaultStore
  Types                    ToolDefinition · ToolContext · EmitResult · …

Access
  runLogin                 OAuth (loopback · device · paste)
  ensureAccessToken
  loadCredentials / saveCredentials / clearCredentials
  Types                    AuthMode · SavedCredentials

Money
  toBaseUnits / formatBaseUnits / MONEY_SCALE
```

## Layers

| Layer      | Directory     | Concern                                             |
| ---------- | ------------- | --------------------------------------------------- |
| Runtime    | `runtime/`    | X-Agent reserve → invoke → settle orchestration     |
| Agent      | `agent/`      | Xpense facade, capabilities (tools), inject, ledger |
| Intent     | `intent/`     | build · validate · lifecycle of a Payment Intent    |
| Governance | `governance/` | budget engine + approval + revoke (the moat)        |
| Settlement | `settlement/` | onchainos gateway · submit · pay-fetch (402)        |
| Access     | `access/`     | OAuth login · credentials · token refresh           |

Money is exact throughout: decimal strings at the boundary, `bigint` (via `viem`) for all arithmetic. `number` is never used for money.
