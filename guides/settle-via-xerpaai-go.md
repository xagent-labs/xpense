# Settle via xerpaai-go

Goal: move from `dry-run` to real settlement through the xerpaai-go `/user/onchainos/*` API. xpense never signs or holds keys — it calls that API with a scoped JWT.

## Steps

1. **Authenticate** — `await xpense.login()` (see [Authentication](./authentication.md)).
2. **Set mode** — `XAGENT_PI_MODE=live` (or `new Xpense({ mode: "live" })`). Only `live` settles real money.
3. **Get the gateway** — `const gw = await xpense.gateway()`. JWT is injected and auto-refreshed.
4. **Check the wallet** — `await gw.walletStatus()`.
5. **Settle** — `gw.x402Sign(...)` for HTTP-402 resources, or `gw.mppCharge(...)` for machine-payment deduction.

```ts
const gw = await xpense.gateway();

await gw.walletStatus();
const signed = await gw.x402Sign({ accepts, resource: "/api/inference" });
const charged = await gw.mppCharge({ challenge });
```

## Covered endpoints

`wallet/{status,login,verify,addresses,balance,logout}` · `x402/sign` · `mpp/charge` · `default-asset/{get,set,unset}`.

Endpoints xerpaai-go has not built are **not** stubbed here.

Reference: [OnchainosGateway](../docs/settlement/onchainos.md) · [submitPaymentIntent](../docs/settlement/submit.md).
