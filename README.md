# X-Agent SDK

`@xagent/xpense` is the TypeScript SDK for X-Agent: a developer layer for governed Agent spend, safe HTTP 402 paid calls, and the future usage-based AI commerce runtime.

The product goal is simple: developers build their AI experience, while X-Agent supplies the controls and commercial infrastructure around a billable capability call.

> This public repository contains SDK code, types, documentation, examples, and test mocks only. User accounts, top-ups, provider keys, model routing, durable ledgers, wallets, and settlement infrastructure belong to the private X-Agent Commerce Gateway. They must never ship in the SDK or a browser bundle.

中文文档请见 [SDK 开发指南](docs/zh-CN/sdk-guide.md) 与 [开发计划](docs/zh-CN/development-plan.md)。

## What is available now

| Capability                                    | Status    | Notes                                                                                           |
| --------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| Payment Intents and spend governance          | Available | Exact money, per-transaction/daily/total limits, approval, revocation, audit fields.            |
| OKX / Onchain OS client                       | Available | Typed wallet status, login, balance, `x402/sign`, and `mpp/charge` access.                      |
| HTTP 402 paid-call loop                       | Available | Challenge → policy/wallet callback → credential → one safe retry.                               |
| X-Agent Commerce Runtime                      | Reference | `reserve → invoke → settle → receipt` contract and local test adapter; not a production ledger. |
| End-user balances, top-ups, and model gateway | Planned   | Private Commerce Gateway responsibility.                                                        |
| LangChain and OpenAI adapters                 | Planned   | Thin adapters on top of the Runtime and Gateway Client.                                         |

## Install

```bash
npm install @xagent/xpense
```

Node.js `>=18.17` and ESM are required.

## Quick start: govern an Agent spend

`dry-run` is the default, so this is the correct first integration step: no real funds move.

```ts
import { Xpense } from "@xagent/xpense";

const xpense = new Xpense({
  mode: "dry-run",
  actor: "research-agent",
  budget: {
    perTxn: { amount: "1", currency: "USDC" },
    daily: { amount: "10", currency: "USDC" }
  }
});

const { intent, submit } = await xpense.emit({
  reason: { category: "api", description: "Buy one weather-data lookup" },
  counterparty: { kind: "api", name: "weather.example" },
  amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});

console.log(intent.id, submit.status); // dry_run
```

Amounts are decimal strings such as `"0.25"`; the SDK uses `bigint` internally. Do not pass JavaScript floating-point amounts.

## Safe 402 paid calls

`createPayFetch` orchestrates the HTTP flow but never holds keys or decides to spend. Your server-side callback validates the offer, authorizes policy/Intent, then requests a credential from the trusted wallet/backend.

```ts
import { createPayFetch } from "@xagent/xpense";

const payFetch = createPayFetch({
  onPaymentRequired: async (challenge, request) => {
    // Validate merchant, resource, asset, and amount before signing.
    const signed = await gateway.x402Sign({
      accepts: (challenge.body as { accepts: unknown }).accepts,
      resource: request.url
    });
    return { headers: { [signed.headerName]: signed.authorizationHeader } };
  }
});

const response = await payFetch("https://provider.example/paid-resource");
```

The wrapper retries exactly once. `GET`/`HEAD` are retryable by default. A `POST` or other unsafe method requires a caller-created `Idempotency-Key` and explicit `allowUnsafeReplay: true`. Redirected 402s, oversized challenges, a second 402, and unsafe credential headers are rejected or stop automatic handling.

## Choose an OpenRouter model through X-Agent

Once the private Gateway is configured, the application uses a short-lived end-user session and chooses the OpenRouter model in code. It never receives an OpenRouter key, project secret, or wallet credential.

```ts
import { createXAgentClient } from "@xagent/xpense";

const xagent = createXAgentClient({
  baseUrl: "https://api.your-xagent-gateway.com/",
  sessionToken: endUserSessionToken
});

const result = await xagent.chat({
  requestId: "chat_01J...",
  provider: "openrouter",
  model: "openai/gpt-5-mini", // developer selects the model
  messages: [{ role: "user", content: "Summarize this conversation" }]
});

console.log(result.content, result.receipt.receiptId);
```

The Gateway validates the project's model allowlist and pricing policy, reserves funds, routes the call, settles actual usage, and returns the receipt. Model choice is a developer concern; authorization, final pricing, and money movement are Gateway concerns.

## Runtime boundary

`createXAgent()` is a server-side reference contract, not yet the hosted client a vibe-coded application calls directly:

```text
requestId + user/project context
  → reserve max charge
  → invoke trusted provider
  → settle exact usage
  → receipt + delivered result
```

The private Gateway must provide authentication, tenant isolation, durable idempotency, provider reconciliation, balances, top-ups, model routing, receipts, and recovery. See the [SDK Integration Guide](docs/development/sdk-guide.md) and [Development Plan](docs/development/development-plan.md).

## Development

```bash
npm test
npm run lint
npm run build
npm run e2e
npm run docs:build
```

## Security requirements

- Never put a project secret, provider key, wallet private key, or access token in a browser, Git history, log, or URL.
- The private Gateway derives tenant/project/user from a short-lived session; it does not trust a client-supplied balance or price.
- Real charges require reserve, settle, receipt, reconciliation, and idempotency. SDK memory is not a production ledger.
- Validate merchant, resource, asset, and amount before signing a 402 challenge.

## License

The SDK’s OSI license is still awaiting project-owner approval; until a license file is added, `package.json` remains `UNLICENSED`. The Commerce Gateway is not released with this SDK.
