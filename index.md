---
layout: home

hero:
  name: xpense
  text: Payments for AI agents
  tagline: A TypeScript SDK to give agents money — spending limits, budgets, approval, and audited Payment Intents.
  actions:
    - theme: brand
      text: Get started
      link: /guides/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/xagent-labs/xpense

features:
  - title: Payment Intents
    details: Build, validate, and track structured Payment Intents through a typed lifecycle. Money is exact end to end — decimal strings at the boundary, bigint for all arithmetic.
  - title: Governance
    details: Per-currency budget engine with spending limits, approval thresholds, and revoke. The gate runs before settlement so an agent can never spend past its policy.
  - title: Settlement on X Layer
    details: Submit intents through a typed gateway, with gas abstraction so agents pay in stablecoins without holding native gas.
  - title: Pay-on-402
    details: Wrap fetch and react to HTTP 402 — agents settle metered API calls inline, no bespoke billing integration required.
---
