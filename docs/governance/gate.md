# GovernanceGate

Layers approval + revoke on top of a `PolicyEngine`. This is the single decision point: approval check first, then atomic budget reservation.

## Constructor

```ts
new GovernanceGate(policy: PolicyEngine)
```

## Methods

```ts
authorize(pi: PaymentIntent): GovernanceDecision
revoke(pi: PaymentIntent): void   // releases the reservation
```

`authorize` flow:

1. `approvalDecision(pi)` — if approval required → `requires_approval` (budget untouched).
2. else `policy.reserve(pi)` — on `BudgetExceededError` → `rejected`.
3. else → `authorized`.

## Example

```ts
import { GovernanceGate, PolicyEngine } from "@xagent/xpense";

const gate = new GovernanceGate(new PolicyEngine({ daily: { amount: "100", currency: "USDC" } }));
const decision = gate.authorize(pi); // "authorized" | "rejected" | "requires_approval"
// on settlement failure:
gate.revoke(pi);
```

## Types

```ts
type GovernanceOutcome = "authorized" | "requires_approval" | "rejected";
interface GovernanceDecision {
  outcome: GovernanceOutcome;
  requiresApproval: boolean;
  reason?: string;
}
```
