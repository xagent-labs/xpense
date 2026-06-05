# Xpense Guides

Task-oriented walkthroughs. Each guide takes one scenario end to end ("emit my first intent", "settle via xerpaai-go", "pay on a 402"). For the per-export reference (signatures, params, types), see [Docs](../docs/index.md).

## Sidebar

```
Getting Started
  Getting Started              install → first emit in dry-run

Payment Intents
  Emit Your First Payment Intent
  Settle via xerpaai-go

Governance
  Set Budgets & Approval

Agents
  Inject Xpense into an Agent
  Pay on 402

Access
  Authentication
```

## Guides

| Guide                                                            | Goal                                             |
| ---------------------------------------------------------------- | ------------------------------------------------ |
| [Getting Started](./getting-started.md)                          | install, construct `Xpense`, emit in dry-run     |
| [Emit Your First Payment Intent](./emit-first-payment-intent.md) | build → govern → record a single intent          |
| [Set Budgets & Approval](./set-budgets-and-approval.md)          | per-currency limits, approval thresholds, revoke |
| [Settle via xerpaai-go](./settle-via-xerpaai-go.md)              | go live: wallet, x402/sign, mpp/charge           |
| [Inject into an Agent](./inject-into-an-agent.md)                | expose capabilities / gate tool calls            |
| [Pay on 402](./pay-on-402.md)                                    | wrap `fetch`, react to HTTP 402                  |
| [Authentication](./authentication.md)                            | OAuth flows, credential storage, refresh         |

## docs vs guides

- **docs/** answers "what is X and what's its signature" — one page per export, API-reference shaped.
- **guides/** answers "how do I accomplish Y" — one page per task, walking through several exports together.
