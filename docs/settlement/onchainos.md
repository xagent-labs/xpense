# OnchainosGateway

Typed client over the xerpaai-go `/user/onchainos/*` API. This is the **only** settlement path — xpense calls xerpaai-go, it never signs transactions or holds keys. Get one via `Xpense.gateway()` (JWT injected from login).

## Constructor

```ts
new OnchainosGateway(opts: OnchainosOptions)
```

```ts
interface OnchainosOptions {
  baseUrl: string;
  accessToken: string;
}
```

## Methods

```ts
walletStatus(): Promise<WalletStatus>
walletLogin(req?: WalletLoginReq): Promise<WalletLoginResult>
walletVerify(otp: string): Promise<WalletVerifyResult>
walletAddresses(chain?: string): Promise<{ addresses?: OnchainosAddress[] }>
walletBalance(req?: WalletBalanceReq): Promise<unknown>
walletLogout(): Promise<{ loggedOut: boolean }>
x402Sign(req: X402SignReq): Promise<X402SignResult>          // HTTP-402 settlement
mppCharge(req: MppChargeReq): Promise<MppChargeResult>       // machine-payment deduction
defaultAssetGet(): Promise<DefaultAsset>
defaultAssetSet(asset: DefaultAsset & { tier?: string }): Promise<DefaultAsset>
defaultAssetUnset(): Promise<{ unset: boolean }>
```

Endpoints xerpaai-go has not built are **not** stubbed here.

## Example

```ts
const gw = await xpense.gateway();
await gw.walletStatus();
await gw.x402Sign({ accepts, resource: "/api/inference" });
await gw.mppCharge({ challenge });
```

## Types

```ts
interface X402SignReq { accepts: unknown; from?: string; resource?: string }
interface X402SignResult { headerName: string; authorizationHeader: string; payment?: …; resolvedRequirement?: … }
interface MppChargeReq { challenge: string; from?: string; txHash?: string }
interface MppChargeResult { protocol; method; intent; mode; authorizationHeader; wallet; challenge? }
interface WalletStatus { loggedIn: boolean; selectedAccountId?: string; addresses?: OnchainosAddress[] }
interface WalletLoginReq { email?; locale? }
interface WalletLoginResult { flowId?; email?; walletAddress? }
interface WalletVerifyResult { email?; walletAddress? }
interface WalletBalanceReq { all?; chain?; tokenAddress?; force? }
interface OnchainosAddress { chainIndex?; address? }
interface DefaultAsset { asset?; chain?; name? }
```
