# validatePaymentIntent / isDecimalString

Pure validators. No throwing — they return an error list (or boolean), so callers decide how to react.

## validatePaymentIntent

```ts
validatePaymentIntent(pi: PaymentIntent): string[]
```

Returns `[]` when the intent is valid; otherwise a list of human-readable error strings.

| Param | Type            | Description         |
| ----- | --------------- | ------------------- |
| `pi`  | `PaymentIntent` | the intent to check |

### Example

```ts
import { validatePaymentIntent } from "@xagent/xpense";

const errors = validatePaymentIntent(pi);
if (errors.length) throw new Error(errors.join("; "));
```

## isDecimalString

```ts
isDecimalString(value: string): boolean
```

True when `value` is a valid decimal money string (e.g. `"12.50"`). Used to keep `number` out of the money path.
