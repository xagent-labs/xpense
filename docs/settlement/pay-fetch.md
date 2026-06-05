# createPayFetch

Wraps the global `fetch` to react to HTTP `402 Payment Required` challenges. On a 402 it clones the response, parses the challenge body, and hands it to your callback — then returns the original response unchanged.

```ts
createPayFetch(opts: PayFetchOptions): typeof fetch
```

```ts
interface PayFetchOptions {
  onPaymentRequired: (challenge: unknown, request: { url: string }) => Promise<void>;
}
```

> `onPaymentRequired` is currently a side-effect-only callback. Auto-retry after settlement is an open design decision — see SPEC §6.

## Example

```ts
import { createPayFetch } from "@xagent/xpense";

const payFetch = createPayFetch({
  onPaymentRequired: async (challenge, { url }) => {
    // emit a Payment Intent, then settle via gateway.x402Sign(...)
  }
});

await payFetch("https://api.example.com/paid-resource");
```
