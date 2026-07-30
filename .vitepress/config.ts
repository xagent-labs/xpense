import { defineConfig } from "vitepress";

const description =
  "TypeScript SDK for agentic payments — spending limits, budgets, approval and audited Payment Intents.";

export default defineConfig({
  title: "xpense",
  description,
  base: "/xpense/",
  cleanUrls: true,
  lastUpdated: true,
  sitemap: { hostname: "https://xagent-labs.github.io" },
  srcExclude: [
    "README.md",
    "SPEC.md",
    "ARCHITECTURE.md",
    "seo/**",
    "src/**",
    "test/**",
    "e2e/**",
    "node_modules/**",
    "dist/**"
  ],
  head: [
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "xpense — Payments for AI agents" }],
    ["meta", { property: "og:description", content: description }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "xpense — Payments for AI agents" }],
    ["meta", { name: "twitter:description", content: description }],
    ["meta", { name: "theme-color", content: "#3451b2" }]
  ],
  themeConfig: {
    nav: [
      { text: "Guides", link: "/guides/getting-started" },
      { text: "Docs", link: "/docs/" },
      { text: "GitHub", link: "https://github.com/xagentAI/xpense" }
    ],
    sidebar: {
      "/guides/": [
        {
          text: "Getting Started",
          items: [{ text: "Getting Started", link: "/guides/getting-started" }]
        },
        {
          text: "Payment Intents",
          items: [
            { text: "Emit Your First Payment Intent", link: "/guides/emit-first-payment-intent" },
            { text: "Settle via xerpaai-go", link: "/guides/settle-via-xerpaai-go" }
          ]
        },
        {
          text: "Governance",
          items: [{ text: "Set Budgets & Approval", link: "/guides/set-budgets-and-approval" }]
        },
        {
          text: "Agents",
          items: [
            { text: "Inject Xpense into an Agent", link: "/guides/inject-into-an-agent" },
            { text: "Pay on 402", link: "/guides/pay-on-402" }
          ]
        },
        {
          text: "Access",
          items: [{ text: "Authentication", link: "/guides/authentication" }]
        }
      ],
      "/docs/": [
        {
          text: "中文文档",
          items: [
            { text: "SDK 开发指南", link: "/docs/zh-CN/sdk-guide" },
            { text: "开发计划", link: "/docs/zh-CN/development-plan" }
          ]
        },
        {
          text: "Introduction",
          items: [
            { text: "Why Xpense", link: "/docs/introduction/why-xpense" },
            { text: "Installation", link: "/docs/introduction/installation" },
            { text: "Mental Model", link: "/docs/introduction/mental-model" }
          ]
        },
        {
          text: "Xpense Facade",
          items: [
            { text: "Xpense", link: "/docs/facade/xpense" },
            { text: "resolveConfig / XpenseConfig", link: "/docs/facade/config" }
          ]
        },
        {
          text: "X-Agent Runtime",
          items: [{ text: "Commerce Runtime", link: "/docs/runtime/commerce-runtime" }]
        },
        {
          text: "Development",
          items: [
            { text: "SDK Integration Guide", link: "/docs/development/sdk-guide" },
            { text: "Development Plan", link: "/docs/development/development-plan" }
          ]
        },
        {
          text: "Intent",
          items: [
            { text: "PaymentIntentBuilder", link: "/docs/intent/builder" },
            { text: "validatePaymentIntent", link: "/docs/intent/validate" },
            { text: "Lifecycle", link: "/docs/intent/lifecycle" },
            { text: "Intent Types", link: "/docs/intent/types" }
          ]
        },
        {
          text: "Governance",
          items: [
            { text: "PolicyEngine", link: "/docs/governance/policy" },
            { text: "GovernanceGate", link: "/docs/governance/gate" },
            { text: "approvalDecision", link: "/docs/governance/approval" }
          ]
        },
        {
          text: "Settlement",
          items: [
            { text: "OnchainosGateway", link: "/docs/settlement/onchainos" },
            { text: "submitPaymentIntent", link: "/docs/settlement/submit" },
            { text: "createPayFetch", link: "/docs/settlement/pay-fetch" },
            { text: "Gas Abstraction", link: "/docs/settlement/gas-abstraction" }
          ]
        },
        {
          text: "Agent",
          items: [
            { text: "capabilities / capabilityMap", link: "/docs/agent/capabilities" },
            { text: "buildInjection", link: "/docs/agent/inject" },
            { text: "PaymentSession", link: "/docs/agent/ledger" },
            { text: "MemoryDefaultStore", link: "/docs/agent/default-store" },
            { text: "Agent Tooling Types", link: "/docs/agent/tooling" }
          ]
        },
        {
          text: "Access",
          items: [
            { text: "runLogin", link: "/docs/access/login" },
            { text: "Credentials & Tokens", link: "/docs/access/credentials" }
          ]
        },
        {
          text: "Money",
          items: [{ text: "Money", link: "/docs/money/money" }]
        }
      ]
    },
    socialLinks: [{ icon: "github", link: "https://github.com/xagentAI/xpense" }],
    search: { provider: "local" },
    editLink: {
      pattern: "https://github.com/xagentAI/xpense/edit/main/:path",
      text: "Edit this page on GitHub"
    },
    footer: {
      message: "Proprietary software. All rights reserved.",
      copyright: "Copyright © 2026 xagent-labs"
    }
  }
});
