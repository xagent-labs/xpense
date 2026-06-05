# Pay on 402

Goal: have `fetch` react to HTTP `402 Payment Required` — emit a Payment Intent and settle the challenge via the gateway.

## Steps

1. **Wrap fetch** — `createPayFetch({ onPaymentRequired })`. The wrapper passes everything through and only fires your callback on a 402.
2. **In the callback** — parse the challenge, `xpense.emit(...)` a Payment Intent, then `gw.x402Sign(...)` to settle.
3. **Note** — the callback is side-effect-only today; it does not auto-retry the request (open design decision, SPEC §6).

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
    await gw.x402Sign({ accepts: challenge, resource: url });
  }
});

await payFetch("https://api.example.com/paid-resource");
```

Reference: [createPayFetch](../docs/settlement/pay-fetch.md) · [OnchainosGateway.x402Sign](../docs/settlement/onchainos.md) · the `x402.pay` [capability](../docs/agent/capabilities.md).
