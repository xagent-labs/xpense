# ADR 0002: Commerce runtime uses a reserve → invoke → settle contract

**Status:** Accepted — 2026-07-30

## Context

The desired developer experience is a LangChain-like call such as `ai.chat(...)`,
but an AI product must also preserve a money-safe association between an end user,
model use, price cap, actual usage, and receipt. Calling a model first and billing
afterwards can create unbounded loss; debiting before a call without recovery can
create a paid-but-undelivered result.

## Options considered

1. Let every framework adapter implement its own credit deduction. This is easy to
   start but duplicates payment logic and makes agent/tool calls inconsistent.
2. Debit an estimated price before invocation. This makes refunds and partial usage
   difficult, and exposes the application to provider-timeout ambiguity.
3. Define a framework-neutral runtime with a two-phase billing port. Reserve a
   bounded maximum, invoke once, then settle actual usage; retain unknown outcomes
   for reconciliation.

## Decision

Adopt option 3. `createXAgent` uses injectable `BillingPort` and `ModelProvider`
contracts. The runtime validates a request, reserves its exact `maxCharge`, invokes
the model, settles an exact `actualCharge` no greater than the reservation, and
returns a receipt together with the model output.

The core includes only an in-memory reference adapter. A hosted backend will be
the authoritative ledger and will implement cross-process idempotency,
authentication/authorization, balance top-up, provider routing, and recovery.

## Consequences

- LangChain/OpenAI/MCP adapters can be thin integrations over one commercial
  execution model.
- The contract stays testable without provider keys, wallets, or network access.
- The SDK fails closed on settlement uncertainty and does not release a reservation
  after an unknown provider result.
- Developers must currently supply a `maxCharge`; a future hosted policy can derive
  it from project configuration without weakening the invariant.

## Threat model

| Boundary              | Failure or abuse                                          | Control                                                                                                             | Residual risk                                                  |
| --------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Application → runtime | replayed or mismatched requests                           | required idempotency key and semantic fingerprint                                                                   | process-local cache is lost on restart                         |
| Runtime → billing     | overspend or cross-user charge                            | explicit user/project context, reservation cap, exact money comparison                                              | durable tenant authorization belongs to the gateway            |
| Runtime → provider    | provider called with no funds or called twice             | reserve before call; local single-flight, provider idempotency key and abort signal                                 | provider-level durable idempotency must be enforced by gateway |
| Provider → settlement | timeout after provider accepts work                       | retain reservation; record provider attempt/delivery IDs; do not return unpaid output; reconcile later              | reference adapter cannot reconcile across processes            |
| Settlement retry      | inconsistent usage or permanent ledger denial is replayed | settlement fingerprint binds reservation, amount, usage, provider attempt and delivery; only retryable errors retry | private gateway must enforce the constraint atomically         |

## Migration and rollback

This adds a new API and does not change `Xpense` or existing payment capabilities.
Clients can remove `createXAgent` usage to roll back. The future gateway must run
additive schema migrations and keep the SDK contract versioned.
