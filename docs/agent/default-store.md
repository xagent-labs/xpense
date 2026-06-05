# MemoryDefaultStore

In-memory implementation of `PaymentDefaultStore` — holds the session's default payment asset / chain / address. Backs the `payment.*_default` capabilities.

## Methods

```ts
get(): PaymentDefault | undefined
set(value: PaymentDefault): void
unset(): void
```

## Types

```ts
interface PaymentDefault {
  defaultAsset: string;
  caip2: string; // chain in CAIP-2
  address: string;
}
interface PaymentDefaultStore {
  get(): PaymentDefault | undefined;
  set(value: PaymentDefault): void;
  unset(): void;
}
```

Swap in your own `PaymentDefaultStore` for persistence beyond the process.
