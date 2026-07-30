# X-Agent Development Plan

## Product outcome

Developers should build product features while X-Agent provides model routing, end-user accounts, top-ups, balances, usage metering, charging, logs, and eventually paid Agent capabilities. This repository remains an SDK; the commercial and funds-moving system remains private.

## P0 — trusted end-user model charging

### Public SDK

- Maintain the English-first README, integration guides, runtime contract, tests, and mocks.
- Maintain the session-scoped `createXAgentClient()` for Gateway model calls; it exposes OpenRouter model choice without exposing secrets or billing internals.
- Add thin OpenAI-compatible and LangChain adapters.

### Private Commerce Gateway

- Organizations, projects, project secrets, and short-lived end-user sessions.
- Unified model gateway: routing, project price policy, output caps, and provider fallback.
- Credits ledger: credit, reserve, settle, release, refund, and adjustment.
- Top-up checkout and idempotent payment webhooks.
- Durable execution, provider-attempt, usage, receipt, and delivery records.
- Balance, ledger, usage, receipt, and reconciliation APIs.
- Rate limits, audit logs, alerts, kill switch, and reconciliation worker.

### Acceptance criteria

Every model call produces either a delivered response with a settled receipt, or no response with a queryable execution/reservation state. It must not allow duplicate charge, cross-project charge, or a client-modified user/price.

## P1 — LangChain-like developer experience

- `xagent.chat()`, `xagent.agent()`, `xagent.user()`, and `xagent.usage()`.
- LangChain Runnable/ChatModel adapter and OpenAI-compatible endpoint.
- Streaming terminal usage/receipt event, reconnect, and delivery recovery.
- MCP/OpenAPI capability registry with price, data policy, SLA, and payment metadata.
- Cost and revenue views by user, task, model, and capability.

## P2 — Agent capability commerce

- x402, MPP, and OKX APP/Broker adapters.
- Agentic Wallet delegated allowances and approval policies.
- Offer, credential, receipt, delivery, and dispute lifecycle for paid capabilities.
- Routing by price, latency, success rate, privacy, quality, and reputation.
- Merchant onboarding, settlement, quality scoring, and two-sided ledger.

## Engineering principles

- Prove payment correctness before expanding the provider catalogue.
- Build credits and a durable ledger before exposing end-user crypto wallets.
- Persist all real state in the private Gateway; the SDK never owns keys.
- Give every P0 workflow idempotency, timeout, Unknown-state reconciliation, and negative tests.
- Public docs distinguish shipped capabilities from planned work.

For the Chinese version, see [开发计划](../zh-CN/development-plan.md).
