# Set Budgets & Approval

Goal: enforce per-currency spend limits and route high-value or human-mode intents through approval — without double-counting.

## Steps

1. **Define a budget** — `BudgetSpec` with `perTxn` / `daily` / `total`, each a `Money`. Limits are tracked **per currency**; the daily counter resets at the UTC day boundary.
2. **Wire the gate** — `new GovernanceGate(new PolicyEngine(budget))`. The facade does this for you from `options.budget`.
3. **Authorize** — `gate.authorize(pi)` returns `"authorized" | "rejected" | "requires_approval"`.
4. **Revoke on failure** — if settlement fails, `gate.revoke(pi)` rolls the reservation back.
5. **Pick one flow** — `reserve`→`release` (atomic, preferred) or `evaluate`→`commit` (legacy). Never `reserve`+`commit`.

```ts
import { GovernanceGate, PolicyEngine, BudgetExceededError } from "@xagent/xpense";

const gate = new GovernanceGate(
  new PolicyEngine({
    perTxn: { amount: "5", currency: "USDC" },
    daily: { amount: "100", currency: "USDC" },
    total: { amount: "500", currency: "USDC" }
  })
);

const decision = gate.authorize(pi);
if (decision.outcome === "requires_approval") {
  // surface decision.reason to a human; budget untouched
}
```

## Approval

Set `approval.mode` on the intent: `"policy"` (budget decides), `"auto"`, or `"human"`. `"human"` and above-threshold intents return `requires_approval` **without** consuming budget.

Reference: [PolicyEngine](../docs/governance/policy.md) · [GovernanceGate](../docs/governance/gate.md) · [approvalDecision](../docs/governance/approval.md).
