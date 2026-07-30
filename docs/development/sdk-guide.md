# SDK Integration Guide

## Audience and boundary

This guide is for developers building AI products with vibe coding, LangChain, the OpenAI SDK, or a custom Agent runtime. The open SDK governs spend and paid capability calls. The private X-Agent Commerce Gateway will own end-user credits, top-ups, provider routing, and durable accounting.

## Recommended integration order

1. Start with `Xpense` in `dry-run` mode and validate Payment Intent/budget behavior.
2. Add `createPayFetch` around paid external APIs; only server code may call wallet or backend signing.
3. When the Gateway is available, call its short-lived end-user-session model API. Do not implement real reserve/settle in the application or browser.
4. Add LangChain or MCP adapters with a budget per Agent task.

## Payment Intent and policy

A Payment Intent is an auditable policy object, not a private key or blockchain transaction. Treat rejection, approval, and revocation as first-class product states.

```ts
const xpense = new Xpense({
  mode: "dry-run",
  budget: { perTxn: { amount: "2", currency: "USDC" } }
});

await xpense.emit({
  reason: { category: "data", description: "Dataset access" },
  counterparty: { kind: "merchant", name: "Acme Data" },
  amount: { kind: "fixed", value: { amount: "1.20", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});
```

## HTTP 402 requirements

```text
Request → 402 → validate offer → authorize policy/budget → backend signing
→ retry once with credential → resource or receipt
```

- Use allowlisted merchants and validated resources only.
- For `POST`, use a business idempotency key and enable replay only if the provider documents idempotency support.
- Preserve identifiers for reconciliation when delivery or payment status is unknown.
- Perform wallet signing only in a server-side trusted execution boundary.

## Runtime and private Gateway

The SDK `createXAgent()` ports (`BillingPort` and `ModelProvider`) define the expected safety state machine and support SDK testing. They are trusted server-side ports, not browser integration points.

The Gateway must enforce:

| Invariant              | Requirement                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| Tenant isolation       | Derive tenant/project/user from session claims; include them in database constraints.          |
| Correct balances       | Append-only credit ledger; transactional reserve, settle, and release.                         |
| No duplicate execution | One execution/provider attempt for a tenant + project + user + idempotency key + request hash. |
| Unknown outcomes       | Persist provider attempt ID, deadline, receipt, and delivery state; reconcile before replay.   |
| Authoritative price    | Calculate admission and end-user price from private project policy, model, and output limits.  |

## Production checklist

- Keep project secrets in the application backend only.
- Mint short-lived, revocable, audience-scoped end-user sessions.
- Keep provider credentials and wallet keys inside the Gateway.
- Enforce object-level authorization on usage, balances, and receipts.
- Verify webhook signatures, time windows, replay protection, and idempotency.
- Use request/receipt IDs for redacted observability.
- Set provider timeouts, `AbortSignal`, concurrency limits, and provider-level idempotency keys.

## Current limitation

This repository does not yet provide real top-ups, user accounts, model routing, a durable ledger, or a Gateway HTTP client. `InMemoryBilling` is test-only and must not be used as a wallet or multi-instance ledger.

See the [Chinese guide](../zh-CN/sdk-guide.md) and [development plan](development-plan.md).
