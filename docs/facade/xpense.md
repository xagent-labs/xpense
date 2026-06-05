# Xpense

The one-stop client. Wraps config, a `GovernanceGate`, a `PaymentSession` ledger, the capability registry, and access/credentials into a single facade. `emit()` is the happy path: build → govern → record.

```ts
import { Xpense } from "@xagent/xpense";

const xpense = new Xpense({
  actor: "research-agent",
  budget: { daily: { amount: "50", currency: "USDC" } }
});
```

## Constructor

```ts
new Xpense(options?: XpenseOptions)
```

| Param            | Type                    | Description                                     |
| ---------------- | ----------------------- | ----------------------------------------------- |
| `options.actor`  | `string`                | audit `createdBy`; defaults to `"xpense"`       |
| `options.budget` | `BudgetSpec`            | per-txn / daily / total limits                  |
| `...`            | `Partial<XpenseConfig>` | `apiBaseUrl`, `frontendBase`, `mode`, `version` |

See [`XpenseOptions`](#xpenseoptions).

## Methods

```ts
login(authMode?: AuthMode): Promise<{ userId: string }>      // default "paste"
whoami(): Promise<SavedCredentials | null>
logout(): Promise<void>
gateway(): Promise<OnchainosGateway>                          // JWT-backed settlement client
createPaymentIntent(draft: PaymentIntentDraft): PaymentIntent // build only, no governance
submitPaymentIntent(pi: PaymentIntent): Promise<SubmitResult> // govern + submit; revokes on failure
emit(draft: PaymentIntentDraft): Promise<EmitResult>          // createPaymentIntent + submitPaymentIntent
toolContext(origin?: TaskOrigin): ToolContext
invoke(capabilityName: string, input: unknown, origin?: TaskOrigin): Promise<ToolResult>
listCapabilities(): ToolDefinition[]
pendingSession(): SessionEntry[]
```

`submitPaymentIntent` throws `BudgetExceededError` on `rejected`, `Error` on `requires_approval`, and on settlement failure calls `gate.revoke(pi)` then rethrows.

## Example

```ts
const { intent, submit } = await xpense.emit({
  reason: { category: "api", description: "Weather data API call" },
  counterparty: { kind: "api", name: "weatherapi.com" },
  amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});
```

## XpenseOptions

```ts
interface XpenseOptions extends Partial<XpenseConfig> {
  budget?: BudgetSpec;
  actor?: string;
}
```
