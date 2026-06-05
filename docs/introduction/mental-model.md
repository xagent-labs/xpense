# Mental Model

The directory tree narrates the spend lifecycle. Read top to bottom:

```
agent/        the agent wants to spend  → capabilities (tools), Xpense facade
   ↓
intent/       describe the spend        → PaymentIntent (build · validate · lifecycle)
   ↓
governance/   is it allowed?            → budget gate + approval + revoke
   ↓
settlement/   make it happen            → onchainos gateway · submit · pay-fetch
   ↑
access/        supplies the JWT settlement calls xerpaai-go with
```

## Payment Intent at a glance

```
id · agentId · userId · schemaVersion
intent      { text, humanPresent }                    authorization strength
allowance   { reason, maxAmount, currency, ... }      scope, welded
governance  { budgetId?, approver?, ... }             the moat
mandate     { intentHash?, cartHash?, paymentHash? }  tamper-evident provenance
amount · counterparty · approval · policy · audit
status: pending → authorized → executing → settled | failed | revoked
```

Funding credentials are **referenced, never embedded**. Keys never reach the agent.

## Modes

| Mode                | Runs policy engine? | Settles real money? |
| ------------------- | ------------------- | ------------------- |
| `dry-run` (default) | yes                 | no                  |
| `mock`              | yes                 | no                  |
| `live`              | yes                 | yes                 |

All modes accumulate spend within the instance, so a simulation surfaces the limits it would hit.
