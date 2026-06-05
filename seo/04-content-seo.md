# 04 · Content SEO — Guide / Blog Titles

12 pieces, each targeting one low-competition long-tail (Tier C in `01`). Order = priority (highest search intent + closest to product first). Each maps to an existing code artifact so it's cheap to write and authoritative.

Each entry: **Title** (= `<title>` minus brand) · target keyword · 1-line angle · maps to.

1. **How to Give an AI Agent a Spending Limit (TypeScript)**
   kw: `AI agent spending limits` · the flagship how-to: per-txn/daily/total budgets in 20 lines · maps to `PolicyEngine`, guide `set-budgets-and-approval`.

2. **x402 Payments in TypeScript: Handle HTTP 402 Payment Required**
   kw: `x402 typescript` · wrap fetch, react to 402, settle · maps to `createPayFetch`, guide `pay-on-402`.

3. **Payment Intents for AI Agents: What They Are and Why You Need One**
   kw: `payment intent (AI agents)` · explainer differentiating from Stripe PaymentIntent; agent-spend provenance · maps to `PaymentIntentBuilder`.

4. **How to Let an AI Agent Pay for an API Call**
   kw: `AI agent pay for API` · weatherapi.com example end-to-end · maps to README quick start + `x402Sign`.

5. **Adding Human Approval to Autonomous Agent Payments**
   kw: `AI agent payment approval workflow` · "needs approver Y above amount X" · maps to `GovernanceGate`, `approval` doc.

6. **Why Money in AI Agents Should Never Be a JavaScript float**
   kw: `bigint money typescript / agent payments precision` · viem bigint, decimal strings; opinion piece with strong shareability · maps to `docs/money/money.md`.

7. **Per-Currency Budgets for AI Agents: Daily, Total, Per-Transaction**
   kw: `per-transaction budget for AI agents` · deep dive on the budget model + UTC reset + reserve/revoke · maps to `PolicyEngine`.

8. **Building an Audit Trail for Every AI Agent Payment**
   kw: `audit trail AI agent payments` · lifecycle state machine + mandate hashes · maps to `intent/lifecycle`, `types`.

9. **Give Your LangChain / MCP Agent a Wallet — Safely**
   kw: `LangChain agent payments / MCP agent payments` · inject xpense as a capability/tool · maps to guide `inject-into-an-agent`, `agent/capabilities`.

10. **Agent Wallet vs Payment Intent: Which Do You Actually Need?**
    kw: `agent wallet vs payment intent` · comparison/decision post; captures "agent wallet" searchers · positions xpense as the governance layer above any wallet.

11. **Safe Autonomous Spending: A Governance Layer for AI Agents**
    kw: `autonomous agent payments governance` · thought-leadership on governance-as-a-layer (the moat) · maps to `why-xpense`.

12. **Settling Stablecoin (USDC) Payments from an AI Agent in TypeScript**
    kw: `USDC payments AI agent typescript` · settlement walkthrough on X Layer (no OKX naming) · maps to guide `settle-via-xerpaai-go`.

## Content rules

- Each post: H1 = exact title (keyword-front), 800-1500 words, real runnable code block, links to ≥2 related guides/API refs (internal clustering → lifts the Tier B pages), one diagram with alt text.
- Add `TechArticle` JSON-LD (`templates/jsonld-tech-article.json`) per post.
- Publish cadence: ship 1-4 first (closest to product/intent), measure, then the rest.
- Cross-post 1, 2, 9 to dev.to / Hashnode with canonical back to the docs domain (dev.to ranks fast and passes referral traffic; canonical avoids duplicate-content penalty).
