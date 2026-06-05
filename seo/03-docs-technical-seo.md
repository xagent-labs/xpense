# 03 · Docs-Site Technical SEO

Spec for when docs ship as a real static site. Recommended generator: **VitePress / Nextra / Astro Starlight** (all emit clean SSG HTML, easy `<head>` control, built-in sitemap). Assume canonical host `https://xpense.xagent.dev` (swap for the real domain).

Drop-in files live in `seo/templates/`. This doc explains them.

## Per-page `<title>` + `<meta description>` formula

Pattern: `Primary keyword for this page | Xpense`. Mirror the viem/x402 pattern (`Name · Value prop`).

| Page type              | `<title>`                                               | `<meta description>` (≤155 chars)                                                                                             |
| ---------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Landing/home           | `Xpense — Agentic Payments SDK for TypeScript`          | `Give AI agents spending limits, budgets and approval. Emit audited Payment Intents and settle via x402 — all in TypeScript.` |
| Guide (generic)        | `{Guide title} — Xpense`                                | first 155 chars of the guide's task outcome, action-led                                                                       |
| Guide: spending limits | `How to Give an AI Agent a Spending Limit — Xpense`     | `Set per-transaction, daily and total budgets for an AI agent in TypeScript with Xpense's policy engine. Step-by-step.`       |
| Guide: pay on 402      | `x402 Payments in TypeScript: Pay on HTTP 402 — Xpense` | `Wrap fetch to handle HTTP 402 Payment Required. Emit a Payment Intent and settle the x402 challenge in TypeScript.`          |
| API ref (generic)      | `{Export name} API — Xpense`                            | `{Export} reference: signature, parameters and an example. Part of the Xpense agentic payments SDK.`                          |
| API ref: PolicyEngine  | `PolicyEngine API — Xpense`                             | `PolicyEngine reference: per-currency bigint budget gate (per-transaction, daily, total) for AI agent payments.`              |

Rules: title ≤ 60 chars where possible (landing is 44), description 120-155 chars, every page's primary keyword once in title + once in description, brand suffix `— Xpense` last.

## OG + Twitter card (per `seo/templates/head.html`)

- `og:type=website` (home) / `article` (guides+blog).
- `og:image` / `twitter:image` → a **1200×630** PNG per page-type (home, guide, ref) or one default. Both viem and tempo use a single branded 1200×630 og.png — start with one default, add per-type later.
- `twitter:card=summary_large_image` everywhere.
- Set `og:url` to the page's canonical absolute URL.

## Canonical rules

- Every page emits `<link rel="canonical" href="{absolute self URL}">`.
- Trailing-slash policy: pick **no trailing slash** and 301 the other form (SSG default differs — enforce one).
- Versioned docs: canonical always points to **latest** stable (`/docs/...`), never a `/vX.Y/` archive, to avoid duplicate-content dilution.
- README on GitHub and the docs landing say similar things → set the **docs landing as canonical** and keep README pointing to docs via `homepage`, so Google consolidates authority on the docs domain.

## robots.txt (per `seo/templates/robots.txt`)

Allow all, point to sitemap, block nothing public. Block any `/playground` or auth callback paths.

## sitemap.xml (per `seo/templates/sitemap.xml`)

Auto-generate at build (every SSG above supports it). Structure: home (priority 1.0) → guides (0.8) → top-level docs sections (0.7) → individual API refs (0.5). Include `<lastmod>`. Submit to Google Search Console + Bing Webmaster.

Section layout to mirror existing IA:

```
/                                 1.0
/guides/getting-started           0.8
/guides/emit-first-payment-intent 0.8
/guides/set-budgets-and-approval  0.8   ← spending-limits target
/guides/pay-on-402                0.8   ← x402-typescript target
/guides/settle-via-xerpaai-go     0.7
/guides/inject-into-an-agent      0.7
/docs/introduction/why-xpense     0.7
/docs/governance/policy           0.6
/docs/intent/builder              0.6
/docs/... (remaining refs)        0.5
```

## JSON-LD structured data

Two schemas (per `seo/templates/jsonld-*.json`). Neither viem nor tempo nor ai-sdk ship JSON-LD — **this is a cheap differentiator** that can earn rich results.

1. **`SoftwareApplication`** on the landing page — declares xpense as a dev tool (category, OS, offers=free/open).
2. **`SoftwareSourceCode`** on landing + repo-linked pages — ties the docs to the GitHub repo + programming language.
3. Optional **`TechArticle`** on each guide/blog (headline, author, datePublished) — strongest signal for the long-tail content pages.
4. Optional **`BreadcrumbList`** on docs pages — drives breadcrumb rich snippets.

## Other technical must-dos

- One H1 per page, containing the page's keyword.
- Descriptive `alt` on every diagram/screenshot.
- Internal links: every guide links to its related API refs and vice versa (topic clustering).
- `lang="en"` on `<html>`; add hreflang only if a zh version ships later.
- Fast: SSG + no client-side-only rendering of content (Google must see text in HTML — all four competitors SSR/SSG their docs).
