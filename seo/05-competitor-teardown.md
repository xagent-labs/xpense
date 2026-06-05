# 05 · Competitor SEO Teardown

Live meta pulled 2026-06-07. What each does, what xpense copies.

## viem.sh — the gold standard for a TS web3 SDK

```
<title>Viem · TypeScript Interface for Ethereum</title>
description: Build reliable Ethereum apps & libraries with lightweight, composable, & type-safe modules from viem.
og:type=website · og:title/desc mirror title · og:image=/og-image.png
twitter:card=summary_large_image · twitter:title/desc mirror
NO JSON-LD.
IA: Introduction / Installation / Getting Started → Clients & Transports → Public/Wallet/Test Actions → Accounts → Contract → ENS/SIWE → ABI → Utilities → integrations (incl. Tempo, Circle USDC) → Account Abstraction → Experimental. Parent topic → specific function pattern.
Hero H1/tagline: "Build reliable Ethereum apps & libraries with lightweight, composable, & type-safe modules from viem."
```

**Copy:** (1) Title formula `Name · Value-prop` — adopt `Xpense — Agentic Payments SDK for TypeScript`. (2) Adjective triad in description ("lightweight, composable, type-safe") → xpense's "typed, auditable, protocol-agnostic". (3) Function-level docs pages = one indexable URL per export (xpense already has 24 — keep that granularity, it's great for long-tail API queries). (4) They ship NO JSON-LD → xpense adds it = differentiator.

## x402.org / Coinbase — owns the head term

```
<title>x402 - Payment Required | Internet-Native Payments Standard</title>
description: x402 is the internet's payment standard. An open standard for internet-native payments that empowers agentic payments at scale...
og:title=x402 - Payment Required · og:desc="...agentic payments at scale."
```

**Takeaway:** they own "x402" and "agentic payments at scale" — **do not fight the head term.** Note they position x402 as a _standard/protocol_, not an SDK. xpense's clean lane: the **TypeScript SDK + governance layer that implements x402**. Copy the phrase "agentic payments" (high relevance) but always pair with "SDK / TypeScript / spending limits" to differentiate.

## tempo.xyz — validates "machine payments"

```
<title>Tempo: the blockchain for payments at scale</title>
description: ...purpose-built, Layer 1 blockchain for payments... including machine payments.
og:image 1200x630 with og:image:width/height/alt set · og:url canonical · og:type=website
```

**Copy:** (1) They set `og:image:width/height/alt` explicitly → do the same (better social rendering). (2) "machine payments" is an indexed term with a serious backer → use it in xpense meta/topics (already in plan). (3) They're a **chain** (`Name: the X for Y`); xpense is the layer above — contrast positioning ("xpense is chain-agnostic governance, not a chain") is a clean differentiator and avoids competing with Tempo/X Layer.

## ai-sdk.dev (Vercel) — minimalist meta, strong brand

```
<title>AI SDK</title>
description: The AI Toolkit for TypeScript, from the creators of Next.js.
og:title=AI SDK · og:image=blob og.png · twitter:card=summary_large_image
NO JSON-LD.
```

**Takeaway:** they can run a 2-word title because the brand is huge — **xpense cannot** (no authority yet), so xpense MUST keep keyword-rich titles (the viem formula, not the ai-sdk formula). Copy their use of a single hosted 1200×630 og.png and `summary_large_image` everywhere.

## Synthesis — what xpense adopts

| Tactic                                       | From       | xpense action                                                  |
| -------------------------------------------- | ---------- | -------------------------------------------------------------- |
| `Name · keyword-rich value prop` title       | viem       | landing title = `Xpense — Agentic Payments SDK for TypeScript` |
| Adjective triad in description               | viem       | "typed, auditable, protocol-agnostic"                          |
| One indexable URL per API export             | viem       | keep the 24 docs pages granular                                |
| Single 1200×630 og.png + summary_large_image | all        | one default og image to start                                  |
| og:image:width/height/alt set                | tempo      | add to head template (done)                                    |
| Use "agentic payments" + "machine payments"  | x402/tempo | in meta + topics (done)                                        |
| Don't fight "x402" head term                 | x402       | always modify: x402 + typescript/SDK/governance                |
| Ship JSON-LD (none of them do)               | gap        | SoftwareApplication + SoftwareSourceCode + TechArticle (done)  |
| Positioning: "the layer above the chain"     | vs tempo   | contrast, don't compete with chains                            |
