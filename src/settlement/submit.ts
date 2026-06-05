import type { PaymentIntent, PaymentIntentMode, SubmitResult } from "../intent/types.ts";

export interface TransportOptions {
  mode: PaymentIntentMode;
}

/**
 * xpense emits a structured Payment Intent; it never calls a settlement endpoint
 * that xerpaai-go does not expose. Real on-chain settlement runs through
 * OnchainosGateway (xerpaai-go /x402/sign, /mpp/charge) at the call site.
 */
export async function submitPaymentIntent(
  pi: PaymentIntent,
  opts: TransportOptions
): Promise<SubmitResult> {
  if (opts.mode === "mock") {
    return { id: pi.id, status: "mock", raw: { echoed: pi.id } };
  }
  if (opts.mode === "live") {
    return { id: pi.id, status: "emitted" };
  }
  return { id: pi.id, status: "dry_run" };
}
