# submitPaymentIntent

Emits a structured Payment Intent according to `mode`. It does **not** call any xerpaai-go settlement endpoint — real on-chain settlement runs through [`OnchainosGateway`](./onchainos.md) at the call site.

```ts
submitPaymentIntent(pi: PaymentIntent, opts: TransportOptions): Promise<SubmitResult>
```

| Param       | Type                | Description                   |
| ----------- | ------------------- | ----------------------------- |
| `pi`        | `PaymentIntent`     | a validated intent            |
| `opts.mode` | `PaymentIntentMode` | `live` \| `dry-run` \| `mock` |

## Behavior by mode

| Mode      | Returned `status` | Side effect    |
| --------- | ----------------- | -------------- |
| `mock`    | `"mock"`          | echoes `pi.id` |
| `live`    | `"emitted"`       | —              |
| `dry-run` | `"dry_run"`       | —              |

```ts
interface TransportOptions {
  mode: PaymentIntentMode;
}
```
