import { toBaseUnits } from "../money.ts";
import type { Money, PaymentIntent } from "../intent/types.ts";

export interface BudgetSpec {
  total?: Money;
  perTxn?: Money;
  daily?: Money;
}

export interface PolicyDecision {
  allowed: boolean;
  requiresHumanApproval: boolean;
}

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceeded";
  }
}

function toBig(money: Money): bigint {
  return toBaseUnits(money.amount);
}

function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export class PolicyEngine {
  private readonly spentTotal = new Map<string, bigint>();
  private readonly spentDaily = new Map<string, bigint>();
  private dailyAnchor: string;

  constructor(
    private readonly budget: BudgetSpec = {},
    private readonly now: () => number = () => Date.now()
  ) {
    this.dailyAnchor = dayKey(this.now());
  }

  evaluate(pi: PaymentIntent): PolicyDecision {
    return this.check(pi);
  }

  reserve(pi: PaymentIntent): PolicyDecision {
    const decision = this.check(pi);
    this.add(pi, 1n);
    return decision;
  }

  release(pi: PaymentIntent): void {
    this.add(pi, -1n);
  }

  commit(pi: PaymentIntent): void {
    this.add(pi, 1n);
  }

  spent(currency: string): { total: bigint; daily: bigint } {
    this.rollDaily();
    return { total: bucket(this.spentTotal, currency), daily: bucket(this.spentDaily, currency) };
  }

  private check(pi: PaymentIntent): PolicyDecision {
    this.rollDaily();
    const money = pi.amount.value;
    const amount = toBig(money);
    const currency = money.currency;

    if (
      this.budget.perTxn &&
      this.budget.perTxn.currency === currency &&
      amount > toBig(this.budget.perTxn)
    ) {
      throw new BudgetExceededError(
        `per-transaction limit exceeded: ${money.amount} > ${this.budget.perTxn.amount} ${currency}`
      );
    }
    if (this.budget.daily && this.budget.daily.currency === currency) {
      if (bucket(this.spentDaily, currency) + amount > toBig(this.budget.daily)) {
        throw new BudgetExceededError(
          `daily limit exceeded for ${currency} (limit ${this.budget.daily.amount})`
        );
      }
    }
    if (this.budget.total && this.budget.total.currency === currency) {
      if (bucket(this.spentTotal, currency) + amount > toBig(this.budget.total)) {
        throw new BudgetExceededError(
          `total budget exceeded for ${currency} (limit ${this.budget.total.amount})`
        );
      }
    }
    return { allowed: true, requiresHumanApproval: pi.approval.mode === "human" };
  }

  private add(pi: PaymentIntent, sign: bigint): void {
    this.rollDaily();
    const money = pi.amount.value;
    const currency = money.currency;
    const delta = toBig(money) * sign;
    set(this.spentTotal, currency, bucket(this.spentTotal, currency) + delta);
    set(this.spentDaily, currency, bucket(this.spentDaily, currency) + delta);
  }

  private rollDaily(): void {
    const today = dayKey(this.now());
    if (today !== this.dailyAnchor) {
      this.spentDaily.clear();
      this.dailyAnchor = today;
    }
  }
}

function bucket(map: Map<string, bigint>, currency: string): bigint {
  return map.get(currency) ?? 0n;
}

function set(map: Map<string, bigint>, currency: string, value: bigint): void {
  map.set(currency, value < 0n ? 0n : value);
}
