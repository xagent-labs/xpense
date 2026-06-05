import type { PaymentDefault, PaymentDefaultStore } from "./tooling.ts";

export class MemoryDefaultStore implements PaymentDefaultStore {
  private value: PaymentDefault | null = null;

  get(): PaymentDefault | null {
    return this.value;
  }

  set(value: PaymentDefault): void {
    this.value = value;
  }

  unset(): void {
    this.value = null;
  }
}
