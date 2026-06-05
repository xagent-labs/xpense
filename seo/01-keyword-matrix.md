# 01 · Keyword Matrix

Competition is judged for a brand-new repo (no domain authority, no backlinks). "Comp" = how hard to rank _now_. Strategy column says what xpense should do.

## Tier A — Primary head terms (high comp, brand-building only, don't expect rank yet)

| Keyword                                      | Intent            | Comp                              | xpense strategy                                                |
| -------------------------------------------- | ----------------- | --------------------------------- | -------------------------------------------------------------- |
| agentic payments                             | informational     | HIGH (Coinbase/Stripe/AWS own it) | use in title/description for relevance, not a rank target      |
| x402                                         | navigational/info | HIGH (x402.org, Coinbase)         | never compete head-on; always modify (see Tier B)              |
| AI agent payments                            | informational     | HIGH                              | secondary phrase in meta, not a target                         |
| machine payments / machine payments protocol | informational     | MED-HIGH (Tempo, MPP)             | use exact phrase "machine payments" — Tempo validates the term |

## Tier B — ★ MAIN ATTACK: mid-tail with low/medium comp where xpense's wedge is unique

These combine a hot term with a modifier xpense actually owns (governance / TypeScript / budget / intent). **Primary rank targets.**

| Keyword                                | Intent            | Comp    | Why xpense wins                                                                                                     |
| -------------------------------------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| ★ AI agent spending limits             | commercial/how-to | LOW-MED | Core feature = PolicyEngine per-txn/daily/total. Almost no SDK names this.                                          |
| ★ agent spending limit SDK             | commercial        | LOW     | near-zero competition, exact-match product                                                                          |
| ★ payment intent (for AI agents)       | commercial        | LOW-MED | "Payment Intent" is xpense's primary noun; differentiate from Stripe's PaymentIntent by always pairing with "agent" |
| ★ agentic payments SDK typescript      | commercial        | LOW-MED | most x402 content is Python/protocol; TS SDK angle is open                                                          |
| ★ x402 typescript                      | commercial        | LOW-MED | x402 head is taken, but "x402 + typescript + client/SDK" is thin                                                    |
| ★ AI agent budget / budget governance  | commercial        | LOW     | governance-as-a-layer is xpense's stated moat                                                                       |
| ★ autonomous agent payments            | informational     | MED     | pair with "governance"/"approval" to escape head comp                                                               |
| agent payment governance / approval    | commercial        | LOW     | almost no one indexes "approval gate" for agents                                                                    |
| pay on 402 / HTTP 402 fetch typescript | how-to            | LOW     | `createPayFetch` is a concrete, searchable artifact                                                                 |
| MPP / machine payment protocol client  | informational     | LOW     | niche, but exact                                                                                                    |

## Tier C — Long-tail (lowest comp, content/blog targets → drives qualified devs)

These map 1:1 to the content briefs in `04`.

- how to give an AI agent a spending limit
- how to let an AI agent pay for an API
- x402 payments in typescript
- AI agent payment approval workflow
- per-transaction budget for AI agents
- audit trail for AI agent payments
- safe autonomous spending for agents
- LangChain / MCP agent payments
- USDC payments for AI agents typescript
- agent wallet vs payment intent (comparison)

## Decision

- **Attack now:** all Tier B ★ rows. They have a real shot for a new repo and exactly match the product.
- **Earn over time:** Tier A — seed them in titles/meta/H1 for topical relevance and brand association; rank follows authority.
- **Content engine:** Tier C — one guide each (see `04`); these are the cheapest wins and feed internal links to Tier B pages.

## Keyword → page mapping (avoid cannibalization)

| Page                       | Owns keyword                                            |
| -------------------------- | ------------------------------------------------------- |
| Landing / homepage         | agentic payments SDK typescript, payment intent (agent) |
| Guide: spending limits     | AI agent spending limits, agent budget                  |
| Guide: pay on 402          | x402 typescript, HTTP 402 fetch                         |
| Guide: governance/approval | agent payment governance, approval workflow             |
| Docs: PolicyEngine         | per-transaction budget for AI agents                    |
| Blog posts                 | each Tier C long-tail                                   |
