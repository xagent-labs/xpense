# approvalDecision

Pure function deciding whether an intent needs human approval before any budget is consumed. Driven by the intent's `approval.mode` and governance thresholds.

```ts
approvalDecision(pi: PaymentIntent): ApprovalDecision
```

| Param | Type            | Description             |
| ----- | --------------- | ----------------------- |
| `pi`  | `PaymentIntent` | the intent under review |

## ApprovalDecision

```ts
interface ApprovalDecision {
  required: boolean;
  reason?: string;
}
```

`required: true` short-circuits `GovernanceGate.authorize` to `requires_approval` without touching the budget. Outline only — exact threshold logic lives in `src/governance/approval.ts`.
