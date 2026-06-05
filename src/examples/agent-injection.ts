import { Xpense } from "../agent/xpense.ts";
import { buildInjection, type PendingToolCall } from "../agent/inject.ts";

async function main(): Promise<void> {
  const xp = new Xpense({
    mode: "dry-run",
    budget: { total: { amount: "200", currency: "USDC" } }
  });

  const toolCalls: PendingToolCall[] = [
    {
      tool: "x402.pay",
      args: {
        accepts: { amount: "50", currency: "USDC", resource: "https://api.example/dataset" }
      }
    },
    {
      tool: "x402.pay",
      args: {
        accepts: { amount: "0.10", currency: "USDC", resource: "https://api.example/inference" }
      }
    }
  ];

  const emitted: string[] = [];
  const injection = buildInjection({
    async resolvePayment(call) {
      const result = await xp.invoke(call.tool, call.args, {
        goal: "acquire training data",
        agentId: "agent-42"
      });
      const intent = result.paymentIntent ?? null;
      if (intent) {
        emitted.push(intent.id);
      }
      return { intent, decision: "allow" };
    }
  });

  for (const call of toolCalls) {
    const decision = await injection.onPendingTool(call);
    process.stdout.write(`tool=${call.tool} decision=${decision}\n`);
  }

  process.stdout.write(`emitted ${emitted.length} payment intents: ${emitted.join(", ")}\n`);
  process.stdout.write(`session pending: ${xp.pendingSession().length}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
