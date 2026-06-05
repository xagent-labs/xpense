# Lifecycle

The Payment Intent state machine. Guards every status change so an intent cannot skip or reverse stages.

```
pending  → authorized | revoked | failed
authorized → executing | revoked | failed
executing → settled | failed
settled  (terminal)
failed   (terminal)
revoked  (terminal)
```

Revoke is only legal pre-execution (`pending`/`authorized`).

## Functions

```ts
canTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean
transition(from: PaymentIntentStatus, to: PaymentIntentStatus): PaymentIntentStatus  // throws if illegal
isTerminal(status: PaymentIntentStatus): boolean
```

## Example

```ts
import { transition, isTerminal } from "@xagent/xpense";

const next = transition("authorized", "executing"); // "executing"
isTerminal("settled"); // true
```
