# Intent Types

All type-only exports from `intent/types.ts`. These are the shape of a Payment Intent and its parts.

## PaymentIntent

The core object. Key fields:

```ts
schemaVersion: "1"
id: string                  // pi_…
reason: PaymentReason
origin: TaskOrigin
counterparty: Counterparty
amount: AmountSpec          // { kind: "fixed" | "limit", value: Money }
approval: ApprovalRequirement
policy: PolicyConstraints
audit: AuditTrail
status?: PaymentIntentStatus
metadata?: Record<string, unknown>
```

## Supporting types

| Type                        | Shape (summary)                                                      |
| --------------------------- | -------------------------------------------------------------------- |
| `Money`                     | `{ amount: string; currency: string }` — amount is a decimal string  |
| `AmountSpec`                | `{ kind: "fixed" \| "limit"; value: Money }`                         |
| `PaymentReason`             | `{ category: string; description: string }`                          |
| `Counterparty`              | `{ kind: CounterpartyKind; name: string; identifiers?: … }`          |
| `CounterpartyKind`          | `"api" \| "merchant" \| …`                                           |
| `ApprovalRequirement`       | `{ mode: ApprovalMode; … }`                                          |
| `ApprovalMode`              | `"policy" \| "auto" \| "human"`                                      |
| `PaymentIntentStatus`       | `pending \| authorized \| executing \| settled \| failed \| revoked` |
| `PaymentIntentMode`         | `"live" \| "dry-run" \| "mock"`                                      |
| `PaymentIntentDraft`        | flat input to `buildFromDraft` / `Xpense.emit`                       |
| `PolicyConstraints`         | `{ allowedCurrencies?: string[]; … }`                                |
| `GovernanceConstraints`     | `{ budgetId?; approver?; requiresApprovalAbove? }`                   |
| `MandateRefs`               | `{ intentHash?; cartHash?; paymentHash? }`                           |
| `AllowanceScope`            | ACP-style scope on the intent                                        |
| `IntentDeclaration`         | `{ text; humanPresent }`                                             |
| `AuditTrail` / `AuditEntry` | tamper-evident event log                                             |
| `TaskOrigin`                | `{ agentId?; goal?; … }`                                             |
| `SettlementScheme`          | `"exact" \| "voucher" \| "stream"`                                   |
| `SubmitResult`              | `{ id; status; raw? }`                                               |
| `PaymentReason`             | see above                                                            |

> Outline only — exact field lists live in `src/intent/types.ts`.
