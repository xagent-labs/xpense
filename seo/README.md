# Xpense SEO Plan

Complete, ready-to-execute SEO plan for `@xagent/xpense` — the agentic payment governance/intent SDK.

Positioning anchor (every asset must reinforce this): **xpense is the protocol-agnostic governance + Payment-Intent layer that lets AI agents spend money safely — budgets, approvals, audit, x402/MPP settlement on X Layer.** It is NOT a chain and NOT a payment rail.

## Files in this folder

| File                        | What it is                                                           | Where it lands |
| --------------------------- | -------------------------------------------------------------------- | -------------- |
| `01-keyword-matrix.md`      | Keyword research, intent buckets, what to attack                     | strategy       |
| `02-github-repo-seo.md`     | repo description, topics, README SEO structure                       | repo (gh)      |
| `03-docs-technical-seo.md`  | title/meta/OG/Twitter templates, sitemap, robots, JSON-LD, canonical | docs site      |
| `04-content-seo.md`         | 12 long-tail guide/blog titles + briefs                              | new content    |
| `05-competitor-teardown.md` | viem / tempo / x402 / ai-sdk meta + IA, what to copy                 | strategy       |
| `06-action-checklist.md`    | prioritized, tagged (repo / docs / content)                          | execution      |
| `templates/`                | drop-in HTML head, robots.txt, sitemap.xml, JSON-LD                  | docs site      |

## Current state (audited 2026-06-07)

- Docs are **markdown only** (`docs/` 24 files, `guides/` 8 files). No HTML/static site is deployed yet — the "web UI" is a Node script (`dist/examples/test-ui.js`), not a docs site.
- `package.json` keywords have a **duplicate `xagent`** and are thin (9 entries). Fixed list in `02`.
- No `homepage` / `repository` field in package.json (both hurt npm SEO). Fix in `06`.
- Therefore: **GitHub repo + npm page are the only live SEO surfaces today.** Highest-ROI work is repo SEO. The docs-site SEO (`03`) is a build-it-right-from-day-one spec for when the docs ship as a real site (recommend VitePress/Nextra/Astro Starlight).

## TL;DR what to attack

1. Own the **niche long-tail** where there is no incumbent: `agent spending limits`, `AI agent budget SDK`, `payment intent governance`, `x402 typescript governance`. (See `01`.)
2. Do NOT try to rank for `x402` head term short-term — Coinbase/x402.org own it. Rank for `x402 + typescript/governance/budget` modifiers instead.
3. Fix repo + npm metadata first (1 hour, biggest immediate lift), then ship a real docs site with the `03` head templates baked in.
