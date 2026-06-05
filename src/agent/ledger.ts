import { formatBaseUnits, toBaseUnits } from "../money.ts";
import type { PaymentIntent } from "../intent/types.ts";

export interface SessionEntry {
  intent: PaymentIntent;
  at: string;
}

export class PaymentSession {
  private entries: SessionEntry[] = [];

  constructor(public readonly sessionId: string) {}

  record(intent: PaymentIntent): void {
    this.entries.push({ intent, at: new Date().toISOString() });
  }

  pending(): SessionEntry[] {
    return [...this.entries];
  }

  total(currency: string): string {
    let sum = 0n;
    for (const entry of this.entries) {
      const money = entry.intent.amount.value;
      if (money.currency === currency) {
        sum += toBaseUnits(money.amount);
      }
    }
    return formatBaseUnits(sum);
  }

  flush(): SessionEntry[] {
    const out = [...this.entries];
    this.entries = [];
    return out;
  }
}
