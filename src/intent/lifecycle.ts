import type { PaymentIntentStatus } from "./types.ts";

const TRANSITIONS: Record<PaymentIntentStatus, readonly PaymentIntentStatus[]> = {
  pending: ["authorized", "revoked", "failed"],
  authorized: ["executing", "revoked", "failed"],
  executing: ["settled", "failed"],
  settled: [],
  failed: [],
  revoked: []
};

export function canTransition(from: PaymentIntentStatus, to: PaymentIntentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(
  from: PaymentIntentStatus,
  to: PaymentIntentStatus
): PaymentIntentStatus {
  if (!canTransition(from, to)) {
    throw new Error(`invalid payment intent transition: ${from} -> ${to}`);
  }
  return to;
}

export function isTerminal(status: PaymentIntentStatus): boolean {
  return TRANSITIONS[status].length === 0;
}
