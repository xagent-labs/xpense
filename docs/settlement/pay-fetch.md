# createPayFetch

`createPayFetch` completes one trusted HTTP 402 paid-call loop:

```text
request → 402 challenge → application policy + wallet → payment credential → one retry → resource
```

The SDK never signs, holds a key, or decides whether to spend. Your callback evaluates policy, creates a `Payment Intent` when applicable, and asks the X-Agent backend / Agentic Wallet for a credential. Return that credential to retry the same request once.

```ts
createPayFetch(opts: PayFetchOptions): typeof fetch
```

## Safe defaults

- A 402 challenge body is read from a cloned response and capped at 64 KiB by default.
- `GET` and `HEAD` may retry once after a credential is returned.
- A non-safe method such as `POST` requires both `allowUnsafeReplay: true` and a caller-supplied `Idempotency-Key` on the original request.
- A redirect or effective URL change disables automatic payment; handle that provider flow explicitly.
- A second 402 is returned as-is. xpense never asks policy to pay twice in one call.
- Returning `undefined` from the callback returns the original eligible 402 unchanged, preserving a manual approval path. An unsafe request without the opt-in and idempotency key is rejected before the callback.

## x402 example

```ts
import { createPayFetch } from "@xagent/xpense";

const payFetch = createPayFetch({
  allowUnsafeReplay: true,
  onPaymentRequired: async (challenge, request) => {
    // 1. Validate the challenge and create/authorize a Payment Intent in your app.
    // 2. Call the scoped backend client. The SDK never receives a private key.
    const signed = await gateway.x402Sign({
      accepts: (challenge.body as { accepts: unknown }).accepts,
      resource: request.url
    });

    return {
      headers: { [signed.headerName]: signed.authorizationHeader }
    };
  }
});

const response = await payFetch("https://api.example.com/paid-resource", {
  method: "POST",
  body: JSON.stringify({ task: "wallet-risk-check" }),
  headers: {
    "content-type": "application/json",
    "Idempotency-Key": "workflow-42:wallet-risk-check"
  }
});
```

For that `POST`, set `allowUnsafeReplay: true` only after the provider has documented idempotency support for the request key. Without both the opt-in and the key, xpense rejects the 402 before it invokes policy or wallet code. Credential headers cannot override `Idempotency-Key`, `Host`, `Content-Length`, cookies, or proxy headers.
