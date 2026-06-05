# 06 · Action Checklist (prioritized)

Tags: **[repo]** = GitHub/npm metadata · **[docs]** = docs-site head/files · **[content]** = write new pages.
Effort: S < 30min · M < half-day · L > half-day.

## P0 — do this week (biggest ROI, repo/npm are the only live surfaces)

| #   | Action                                                                                                                | Tag    | Effort |
| --- | --------------------------------------------------------------------------------------------------------------------- | ------ | ------ |
| 1   | Set repo About description to the 118-char string in `02`                                                             | [repo] | S      |
| 2   | Add all 20 GitHub topics from `02`                                                                                    | [repo] | S      |
| 3   | Fix `package.json`: dedupe `xagent`, replace keywords, add `homepage` + `repository` (see `02`)                       | [repo] | S      |
| 4   | Rewrite README top: keyword-rich H1, badge row, the 150-word SEO paragraph, TOC anchors, diagram with alt text (`02`) | [repo] | M      |
| 5   | Add a flow diagram image to README (reuse mental-model graphic) with descriptive alt                                  | [repo] | M      |

## P1 — next 2-3 weeks (stand up the docs site = unlocks all on-page SEO)

| #   | Action                                                                                          | Tag    | Effort |
| --- | ----------------------------------------------------------------------------------------------- | ------ | ------ |
| 6   | Pick + scaffold docs SSG (VitePress/Nextra/Starlight); port existing `docs/`+`guides/` markdown | [docs] | L      |
| 7   | Wire `templates/head.html` into the SSG; fill per-page title/description from `03` table        | [docs] | M      |
| 8   | Generate `sitemap.xml` at build (use `templates/sitemap.xml` as structure) + add `robots.txt`   | [docs] | S      |
| 9   | Inject JSON-LD: SoftwareApplication + SoftwareSourceCode on landing (`templates/jsonld-*`)      | [docs] | S      |
| 10  | Enforce canonical + trailing-slash policy (`03`)                                                | [docs] | S      |
| 11  | Create one default 1200×630 og.png; set og/twitter image tags                                   | [docs] | M      |
| 12  | Set `package.json` homepage → docs domain once live                                             | [repo] | S      |
| 13  | Submit sitemap to Google Search Console + Bing Webmaster                                        | [docs] | S      |

## P2 — ongoing (content engine for long-tail)

| #   | Action                                                                                     | Tag       | Effort |
| --- | ------------------------------------------------------------------------------------------ | --------- | ------ |
| 14  | Write content pieces 1-4 from `04` (spending limit, x402 TS, payment intents, pay-for-API) | [content] | L      |
| 15  | Add `TechArticle` JSON-LD per guide/post (`templates/jsonld-tech-article.json`)            | [docs]    | S      |
| 16  | Internal-link guides ↔ API refs (topic clustering)                                         | [docs]    | M      |
| 17  | Cross-post pieces 1,2,9 to dev.to/Hashnode with canonical back to docs                     | [content] | M      |
| 18  | Write content pieces 5-12 over following weeks                                             | [content] | L      |

---

## ★ Main-thread action list (ZIHAO-authorized actions only)

### A. `gh` / npm commands to run (after authorization)

```sh
# 1. repo description
gh repo edit xagent-labs/xpense \
  --description "TypeScript SDK for agentic payments: give AI agents spending limits, budgets & approval, emit Payment Intents, x402."

# 2. topics (gh replaces the full set)
gh repo edit xagent-labs/xpense \
  --add-topic agentic-payments --add-topic ai-agents --add-topic agent-payments \
  --add-topic payment-intent --add-topic x402 --add-topic spending-limits \
  --add-topic agent-budget --add-topic machine-payments --add-topic autonomous-agents \
  --add-topic typescript --add-topic typescript-sdk --add-topic payments-sdk \
  --add-topic agent-governance --add-topic ai-payments --add-topic stablecoin-payments \
  --add-topic usdc --add-topic viem --add-topic mcp --add-topic llm-agents --add-topic fintech
```

### B. Repo file edits (PR, src/ untouched)

- `package.json` → keywords/homepage/repository fixes (`02`).
- `README.md` → new H1 + badges + SEO paragraph + TOC + diagram (`02`).

### C. Docs-site work (when site is built)

- Add `head.html` head tags per page (`03` title/meta table).
- Add `robots.txt`, generated `sitemap.xml`, JSON-LD blocks, canonical tags.
- Host one 1200×630 og.png.
- Submit sitemap to Search Console + Bing.

### D. Content (write + publish)

- 12 guide/blog posts from `04`, starting with #1-4.

> Not done here by design: no git commit/push, no repo settings changed, no src/ edits, no live topic changes. All drafts live in `seo/`.
