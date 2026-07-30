# Pay on 402

Goal: have `fetch` react to HTTP `402 Payment Required` — emit a Payment Intent and settle the challenge via the gateway.

## Steps

1. **Wrap fetch** — `createPayFetch({ onPaymentRequired })`. The wrapper passes normal responses through and handles one 402 payment retry.
2. **In the callback** — validate the challenge, `xpense.emit(...)` a Payment Intent, then call `gw.x402Sign(...)` for a credential.
3. **Return the credential** — the wrapper attaches it and retries the same request exactly once. xpense never holds a private key.

```ts
import { createPayFetch } from "@xagent/xpense";

const gw = await xpense.gateway();

const payFetch = createPayFetch({
  onPaymentRequired: async (challenge, { url }) => {
    await xpense.emit({
      reason: { category: "x402", description: `x402 for ${url}` },
      counterparty: { kind: "api", name: url },
      amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
      approval: { mode: "policy" },
      policy: {}
    });
    const signed = await gw.x402Sign({
      accepts: (challenge.body as { accepts: unknown }).accepts,
      resource: url
    });
    return { headers: { [signed.headerName]: signed.authorizationHeader } };
  }
});

await payFetch("https://api.example.com/paid-resource");
```

Reference: [createPayFetch](../docs/settlement/pay-fetch.md) · [OnchainosGateway.x402Sign](../docs/settlement/onchainos.md) · the `x402.pay` [capability](../docs/agent/capabilities.md).
