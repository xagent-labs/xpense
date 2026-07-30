# Commerce Runtime

## Outcome

Xpense should let an AI-product developer write product behavior while the runtime
coordinates a billable model invocation. The developer supplies an authenticated
user, project, idempotency key, messages, and a maximum spend. The runtime owns
the execution sequence:

```text
validate context → reserve a maximum charge → invoke a model → settle actual usage → return output + receipt
```

The public SDK shape is deliberately framework-neutral. LangChain, OpenAI SDK,
MCP, and framework-specific adapters will call this core rather than reimplement
wallet or metering rules.

```ts
const ai = createXAgent({ model, billing });

const result = await ai.chat({
  requestId: "chat_01J...",
  userId: user.id,
  projectId: "proj_support",
  model: "auto",
  maxCharge: { amount: "0.05", currency: "USD" },
  messages: [{ role: "user", content: "Summarise this conversation" }]
});

// result.content, result.usage, result.receipt
```

## Scope and non-goals

This first SDK slice defines the safe contract and includes an in-memory reference
billing adapter for tests and local demos. It does **not** provide a hosted wallet,
real card/crypto top-up, a production ledger, tax handling, provider routing, or
live model credentials. Those belong to the authenticated Commerce Gateway API.

The reference adapter must never be used across processes or as a real-money
ledger. It exists to make the contract testable before the server implementation.

## Contracts and ownership

| Component                         | Owns                                                                           | Must not own                            |
| --------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| Application                       | authenticated `userId`, UX, task policy, model prompt                          | wallet keys, ledger mutation logic      |
| Runtime                           | validation, local idempotency, reserve → invoke → settle orchestration         | provider secrets, direct money movement |
| `BillingPort`                     | authorization, reservation, settlement, receipt                                | untrusted client identity               |
| `ModelProvider`                   | provider invocation and authoritative usage/cost returned by a trusted gateway | user balances or wallet access          |
| Hosted Commerce Gateway (planned) | tenant authorization, durable ledger, top-up, routing, audit and recovery      | application business rules              |

`BillingPort` and `ModelProvider` are trusted server-side ports in production.
Never put a privileged implementation or provider key into a browser bundle.

## Safety properties

- `requestId` is required. A duplicate key with different request semantics fails.
- The runtime reserves `maxCharge` before a provider call; actual settlement cannot
  exceed it.
- A provider failure only releases a reservation when the provider states that it
  definitively did not execute. Timeout/unknown outcomes stay reserved for
  reconciliation.
- A settlement failure does not return generated content. Only an adapter-classified
  retryable failure stays eligible for an SDK retry; unknown and permanent failures
  require Gateway reconciliation instead of blind replay.
- The in-process idempotency cache is not a substitute for a durable, tenant-scoped
  idempotency and receipt store.

## Production API requirements

The follow-up gateway must provide an authenticated versioned API with object-level
tenant/project/user authorization. It will atomically persist `Reservation`,
`Usage`, `Settlement`, `Receipt`, and `Delivery` records; use a unique tenant +
idempotency key; support reconciliation for unknown provider outcomes; and expose
safe read-only usage and receipt views. The gateway will own model routing,
provider credentials, rate limits, logs/redaction, alerts, and top-up payment
webhooks.

For every invocation the Gateway must persist an execution, reservation, provider
attempt (including provider idempotency key and deadline), usage, settlement,
receipt, and delivery record. Its unique idempotency constraint is tenant + project +
user + request key plus a request hash. After an unknown provider outcome or a
settlement/delivery failure, the Gateway reconciles the stored provider attempt;
it never invokes the provider a second time merely because an SDK process restarted.

The gateway, not the SDK or model provider adapter, calculates the end-user charge
from its versioned project price policy. It may retain raw provider cost and the
developer margin in private accounting, but `actualCharge` is the exact amount to
settle from the end-user balance.

The detailed Gateway API, data model, provider configuration, payment-provider
webhooks, and internal settlement routes are maintained in the private backend
repository. This public repository exposes only the SDK client and stable types;
it contains no wallet keys, provider credentials, ledger implementation, or
payment-service source.

## Success measure

For a model call made through the runtime, a developer can deterministically obtain
either (a) a response paired with a settled receipt, or (b) a typed failure with a
reservation ID that can be reconciled. The SDK must never invoke a provider when
the reservation is denied, and must not invoke it twice for a duplicate key within
one runtime process.
