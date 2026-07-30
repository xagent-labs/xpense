# Xpense — Architecture (Agentic Payment Stack)

> Status: **ratified blueprint.** Derived from a competitive analysis of the 2026 best-in-class
> agentic-payment designs (Stripe ACP · Google AP2 · Coinbase x402/AgentKit/Spend-Permissions ·
> Tempo MPP · Visa/Mastercard agent pay). This doc is the north star; code grows toward it.

## What the best converge on

| Concern           | Best-in-class answer                                                                                                    | We adopt                                                                                             |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Authorization     | scoped delegation token — funding **reference** + scope + risk + revocable state. Credentials **never** reach the agent | xerpaai-go custodies the onchain wallet; xpense holds only a scoped JWT — keys never reach the agent |
| Intent provenance | AP2 three-mandate chain: Intent → Cart → Payment, hash-linked, tamper-evident                                           | mandate hashes embedded in the Payment Intent                                                        |
| Trigger           | x402 (HTTP 402 → PAYMENT-SIGNATURE), 1-line server / client                                                             | x402 in the settlement layer                                                                         |
| Pricing           | Tempo MPP: one-time / pay-as-you-go voucher / streamed                                                                  | `scheme` on the intent                                                                               |
| SDK shape         | core (one tool definition) → thin per-framework adapters → MCP server out                                               | `agent/` + `agent/adapters/` + MCP                                                                   |
| **Governance**    | **nobody isolates it** — tokens carry only a spend cap, not "needs approver Y above X"                                  | **our moat: `governance/` as its own layer**                                                         |

## Layers (code = business)

```
runtime/      L7 商业执行层 — X-Agent chat orchestration · reserve → invoke → settle · receipt contract
agent/        L7 应用层 — Xpense facade · capabilities (tools) · inject · ledger · default-store · adapters/(planned: langchain/openai/mcp)
intent/       L6 意图   — PaymentIntent (AP2 intent + ACP allowance + mandate refs + lifecycle)
governance/   L5 治理   — budget gate + approval + revoke  ← differentiation, abstract it out
settlement/   L4-L1     — onchainos (typed client over xerpaai-go /user/onchainos/*) · submit (emit) · pay-fetch (402)
access/       授权/接入 — OAuth login · credentials · token refresh → supplies the JWT settlement calls with
money.ts · http.ts · config.ts · cli.ts · index.ts
```

xpense calls the xerpaai-go on-chain API — it does **not** sign transactions, hold keys, or stub endpoints xerpaai-go has not built. Settlement primitives = `x402/sign` (HTTP-402) and `mpp/charge` (machine-payment deduction).

The directory tree narrates the spend lifecycle: **User/Task → Runtime reservation → Model or capability → Exact settlement → Receipt.** `runtime/` is open-source orchestration only; its production BillingPort and ModelProvider implementations belong to the closed X-Agent Commerce Gateway.

## Payment Intent object (target)

```
id · agentId · userId · schemaVersion
intent      { text, humanPresent }                              ← AP2 authorization strength
allowance   { reason, maxAmount, currency, merchantId?, expiresAt? }  ← ACP scope, welded
governance  { budgetId?, approver?, requiresApprovalAbove? }    ← our moat
mandate     { intentHash?, cartHash?, paymentHash? }            ← tamper-evident provenance
amount · counterparty · approval · policy · audit               ← existing
network(CAIP-2)? · scheme(exact|voucher|stream)? · status
status: pending → authorized → executing → settled | failed | revoked   (revoke only pre-execution)
```

Funding credentials are referenced, never embedded. `schemaVersion` stays `"1"`; all new fields are additive/optional.

## Build order (value-ranked)

1. **intent/** — PaymentIntent object above + lifecycle state machine. _(done)_
2. **governance/** — approval + revoke on top of the per-currency budget engine. The moat. _(done)_
3. **access/** — OAuth login + credential store + token refresh → scoped JWT for xerpaai-go. _(done)_
4. **settlement/** — `OnchainosGateway` over xerpaai-go `/user/onchainos/*` (wallet · x402/sign · mpp/charge · default-asset). _(done; gaps tracked as xerpaai-go issues, never stubbed)_
5. **runtime/** — framework-neutral `createXAgent()` contract: user/project context, model invocation, reserve → settle, receipt and SDK-local idempotency. _(done; reference adapter only)_
6. **closed Commerce Gateway** — durable tenant ledger, top-up, model routing, account/session API and recovery. _(next, separate service)_
7. **agent/adapters/** + MCP server — one tool definition, many frameworks. The distribution shape. _(planned)_

## Never

- Expose private keys / funding credentials to the agent (whole industry forbids it).
- Issue a governance token to a payment agent — value flows on real Payment Intents.
- Lock into Stripe ACP (fiat card-only) for the crypto path; borrow its `allowance` shape only.
- Blur merchant-of-record — fulfilment / tax / dispute rights stay merchant-side.
