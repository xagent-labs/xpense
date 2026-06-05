# 02 · GitHub Repo + npm SEO

GitHub repo search, Google, and the npm page all index the repo description, README H1/first-paragraph, and topics. These are the **only live SEO surfaces today** — do these first.

## Repo description (≤ 120 chars, keyword-front-loaded)

GitHub's "About" description shows in repo search + Google snippet. Lead with the rank target.

**Recommended (118 chars):**

```
TypeScript SDK for agentic payments: give AI agents spending limits, budgets & approval, emit Payment Intents, x402.
```

Alternates (pick by emphasis):

- Governance-first (115): `Governance layer for AI agent payments — spending limits, budgets, approval & audited Payment Intents in TypeScript.`
- x402-first (112): `x402 + agentic payments SDK for TypeScript. Spending limits, budgets, approval gates and audited Payment Intents.`

Rules applied: primary keyword in first 5 words, no "X Layer/OKX" naming (per constraint), no fluff verbs, fits the 120 GitHub soft limit so nothing truncates in search.

## Topics (GitHub max 20; lowercase, hyphenated). Use all 20:

```
agentic-payments
ai-agents
agent-payments
payment-intent
x402
spending-limits
agent-budget
machine-payments
autonomous-agents
typescript
typescript-sdk
payments-sdk
agent-governance
ai-payments
stablecoin-payments
usdc
viem
mcp
llm-agents
fintech
```

Rationale: covers every Tier A/B keyword as a discoverable topic; `mcp` + `llm-agents` + `ai-agents` catch the framework-integration crowd; `viem`/`usdc`/`stablecoin-payments` catch web3 devs; `typescript`/`typescript-sdk` are high-traffic GitHub topics that boost discovery. Dropped weak/internal terms (`xagent`, `mpp`, `onchainos`) — they have ~0 search demand. Keep `mpp`/`onchainos` only in npm keywords (brand), not topics.

## package.json keywords (npm registry SEO — separate from GitHub topics)

Current list has a **duplicate `xagent`** and is thin. Replace with:

```json
"keywords": [
  "agentic-payments",
  "ai-agents",
  "agent-payments",
  "payment-intent",
  "x402",
  "spending-limits",
  "agent-budget",
  "agent-governance",
  "machine-payments",
  "autonomous-agents",
  "typescript",
  "payments",
  "usdc",
  "stablecoin",
  "viem",
  "mcp",
  "xagent",
  "xpense"
]
```

Also add (missing, both help npm + Google):

```json
"homepage": "https://github.com/xagent-labs/xpense#readme",
"repository": { "type": "git", "url": "git+https://github.com/xagent-labs/xpense.git" }
```

(If/when a docs site ships, point `homepage` at it instead.)

## README SEO structure

npm renders README on the package page; Google indexes it heavily. Rework the top per this skeleton (keep existing body):

1. **H1 with primary keyword** (current `# @xagent/xpense` is brand-only, invisible to search).
   Recommended:

   ```
   # @xagent/xpense — Agentic Payments SDK for TypeScript
   ```

   (`# Xpense` looks cleaner but `# @xagent/xpense — Agentic Payments SDK for TypeScript` wins SEO. H1 must contain the rank phrase.)

2. **Badge row** (social proof + trust signals Google/devs read):

   ```md
   [![npm version](https://img.shields.io/npm/v/@xagent/xpense)](https://www.npmjs.com/package/@xagent/xpense)
   [![npm downloads](https://img.shields.io/npm/dm/@xagent/xpense)](https://www.npmjs.com/package/@xagent/xpense)
   [![CI](https://img.shields.io/github/actions/workflow/status/xagent-labs/xpense/ci.yml)](https://github.com/xagent-labs/xpense/actions)
   [![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
   [![License](https://img.shields.io/badge/license-proprietary-lightgrey)](#license)
   ```

3. **First 150 words = the SEO-load-bearing paragraph.** Must contain, naturally: _agentic payments, AI agent, spending limits, budgets, approval, Payment Intent, TypeScript, x402, governance._ Suggested replacement for the current blockquote:

   > **Xpense is a TypeScript SDK for agentic payments** — it lets an AI agent spend money safely. Give an agent **spending limits** (per-transaction, daily, total budgets per currency), require **human approval** above a threshold, and turn every "the agent wants to pay" moment into a validated, auditable **Payment Intent** before anything settles. Xpense is the **governance + intent layer**: it is protocol-agnostic, never holds keys, and settles through an on-chain API (HTTP **x402** / machine payments). Amounts are exact integers via `viem` — never floats.

4. **Keyword density:** target the primary phrase ("AI agent" / "agentic payments" / "Payment Intent") ~3-5x in the first 300 words, then natural. Do NOT stuff — Google penalizes; the paragraph above is already at a healthy density.

5. **Internal anchors / TOC** under the intro (Install · Quick start · Payment Intents · Budgets & governance · Pay-on-402 · Settlement). Helps Google sitelinks and on-page navigation.

6. **Social proof block** (when available): "Used by N agents / N intents emitted", logos, or a one-line testimonial. Add as soon as there's any traction — it lifts CTR and dwell time.

7. **One diagram** (the agent → intent → governance → settlement flow already in `docs/introduction/mental-model.md`). A README image improves dwell time and is itself indexable (give it descriptive alt text: `alt="AI agent payment flow: agent emits a Payment Intent, governance checks budget and approval, then settles via x402"`).

## Constraint check

- No "OKX" / "OKX Agentic" anywhere. ✅ (settlement described as "on-chain API / X Layer / x402".)
- "X Layer" is fine to mention in body; not needed in topics/keywords (no search demand, and keeps repo description under 120).
