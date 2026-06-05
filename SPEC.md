# Xpense — Specification

> `@xagent/xpense` — Agentic Payment Stack. Inject payment capabilities into agents; emit structured, policy-gated, auditable **Payment Intents** (x402 / mpp), settled through the xerpaai-go on-chain API.

Status: v0.1.0 · ESM library + `xpense` CLI · published `@xagent` scope.

---

## 1. Objective

Turn "an agent wants to spend money" into a **validated, budget-checked, auditable Payment Intent** _before_ anything settles.

- **Target users**: developers building autonomous/agentic systems that must spend money (API calls, SaaS, on-chain) under human-defined guardrails.
- **Core value**: money is never a JS float; every spend passes a policy engine; every intent carries an audit trail; nothing settles unless `mode = live`.
- **Out of scope (today)**: custody / key management, fiat rails, multi-tenant accounting, a hosted dashboard.

---

## 2. Commands

| Command                      | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
| `npm run build`              | `tsc -p tsconfig.build.json` → `dist/`         |
| `npm run lint`               | `tsc --noEmit` type-check (no separate linter) |
| `npm test`                   | `vitest run` — full suite                      |
| `npx vitest run <file>`      | single test file                               |
| `npm run example:governance` | governance limits scenario (reject / approval) |
| `npm run example:settlement` | settlement payloads to xerpaai-go (mock)       |
| `npm run login:smoke`        | `dist/examples/auth-login.js` auth smoke       |
| `xpense login`               | CLI OAuth (`loopback` \| `device` \| `paste`)  |

---

## 3. Project structure

Layers narrate the spend lifecycle: **agent → intent → governance → settlement**, with `access/` supplying the JWT that settlement needs.

```
src/
  agent/        Xpense facade · capabilities (tool registry) · inject · ledger · default-store · tooling
  intent/       types · builder (fluent) · validate · lifecycle (state machine)
  governance/   policy (per-currency bigint budget engine) · gate (approval + revoke) · approval
  settlement/   onchainos (typed client over xerpaai-go /user/onchainos/*) · submit (emit) · pay-fetch (402)
  access/       login · loopback/device/paste OAuth · credentials · token refresh · exchange
  money.ts      viem parseUnits/formatUnits — exact bigint money
  http.ts       thin fetch wrapper (envelope, timeout, bearer)
  config.ts     env-overridable config resolver
  cli.ts        bin entry
  examples/     runnable end-to-end examples
test/           vitest suite — mirrors src/ (source tree stays free of test files)
e2e/            playwright smoke
```

Business-layered, not fragmented: one directory per domain concern. Classes only for stateful units (`Xpense`, `PolicyEngine`, `GovernanceGate`, `PaymentIntentBuilder`, `PaymentSession`, `OnchainosGateway`); everything else is small free functions. xpense calls xerpaai-go — it never re-implements on-chain logic, and endpoints xerpaai-go has not built are **not** stubbed here.

---

## 4. Code style

- **ESM only**, `type: module`, Node `>=18.17`. Source uses `.ts` import specifiers; TypeScript rewrites them to `.js` on emit (`rewriteRelativeImportExtensions` + `allowImportingTsExtensions`).
- **No comments** — names carry intent; if a line needs a comment, rename or extract.
- **Money is exact**: amounts are decimal strings (`"12.50"`) at the boundary; all arithmetic via `viem` `parseUnits` → `bigint`. **`number` is forbidden for money.**
- **IDs, not slugs** for any identifier (`pi_…`, `sess_…`).
- Builder/fluent for construction; pure validators returning `string[]` errors.
- Inject config & clocks (`now: () => number`) rather than reading globals — keeps logic testable.
- No proxy/networking shims in code — proxying is the operator's environment concern.

---

## 5. Testing strategy

- **Runner**: vitest. Tests live under top-level `test/`, mirroring `src/` — the source tree stays free of `*.test.ts` (`include: ["test/**/*.test.ts"]`).
- **TDD is mandatory for money & auth** — write the failing test that reproduces the defect first (red), then fix (green). No "ship first, fix later" on payment/auth paths.
- **Money tests must prove precision**: e.g. `0.1 + 0.2` fits a `0.3` budget; per-currency isolation; daily reset across a day boundary; `reserve` atomicity vs TOCTOU.
- Network is mocked at the `http.ts` boundary; no live calls in tests.
- Gate before any publish: `lint` + `test` + `build` all green (`prepublishOnly`).

---

## 6. Boundaries

**Always**

- Keep money in `bigint` via viem; validate Payment Intents before submit. This includes the session ledger (`PaymentSession.total`) — never `Number()` an amount.
- Enforce budgets per-currency; default `mode = dry-run`. All modes run the policy engine; `dry-run`/`mock` accumulate spend within the instance so a simulation surfaces the limits it would hit. Only `mode = live` settles real money.
- `PolicyEngine` is **in-process, single-runtime** — its `reserve`/`release` Maps do not coordinate across workers/processes. Use exactly one budget flow per spend: `reserve`→`release` (atomic, preferred) **or** `evaluate`→`commit` (legacy). Never pair `reserve`+`commit` — that double-counts.
- Store credentials `0600` under `~/.config/xagent`; auto-refresh access tokens.
- Test-first on anything touching auth, payments, or on-chain.

**Ask first**

- Changing any **public API** (exports in `index.ts`) or the Payment Intent `schemaVersion`.
- Switching default `mode` to `live`, or adding a runtime dependency.
- Behavior changes to `pay-fetch` (e.g. auto-retry after settlement — currently a side-effect-only callback, **open decision**).

**Never**

- Float math for money; secrets committed to the repo; `git commit`/`push` without an explicit instruction.
- Network/proxy logic baked into library code.
- Couple xpense to a specific agent framework — it emits intents, it does not own the agent loop.
