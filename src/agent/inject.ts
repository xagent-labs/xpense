import type { PaymentIntent } from "../intent/types.ts";

export interface PendingToolCall {
  tool: string;
  args: unknown;
}

export type PendingDecision = "allow" | "deny";

export interface PaymentResolution {
  intent: PaymentIntent | null;
  decision: PendingDecision;
}

export interface InjectOptions {
  resolvePayment: (call: PendingToolCall) => Promise<PaymentResolution>;
}

export interface AgentInjection {
  onPendingTool: (call: PendingToolCall) => Promise<PendingDecision>;
  toolContext: Record<string, unknown>;
}

export function buildInjection(
  opts: InjectOptions,
  toolContext: Record<string, unknown> = {}
): AgentInjection {
  return {
    async onPendingTool(call: PendingToolCall): Promise<PendingDecision> {
      const resolution = await opts.resolvePayment(call);
      return resolution.decision;
    },
    toolContext
  };
}
