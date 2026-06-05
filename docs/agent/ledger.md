# PaymentSession

In-session ledger of recorded Payment Intents. The `Xpense` facade records every successfully submitted intent here; never `Number()` an amount — totals stay `bigint`.

## Constructor

```ts
new PaymentSession(id: string)   // id is a sess_… string
```

## Methods

```ts
record(pi: PaymentIntent): void
pending(): SessionEntry[]
// total is tracked as bigint (per SPEC §6)
```

## SessionEntry

```ts
interface SessionEntry {
  intent: PaymentIntent;
  // …recorded-at and status fields
}
```

Outline only — exact entry fields live in `src/agent/ledger.ts`.
