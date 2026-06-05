import { Xpense } from "../index.ts";
import type { ApprovalMode } from "../index.ts";

async function attempt(
  xp: Xpense,
  label: string,
  amount: string,
  approval: ApprovalMode
): Promise<void> {
  const intent = xp.createPaymentIntent({
    reason: { category: "demo", description: label },
    counterparty: { kind: "api", name: "svc" },
    amount: { kind: "fixed", value: { amount, currency: "USDC" } },
    approval: { mode: approval },
    policy: {}
  });
  try {
    const submit = await xp.submitPaymentIntent(intent);
    process.stdout.write(`  ${label} → AUTHORIZED (${submit.status})\n`);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const tag = /approval/i.test(msg) ? "REQUIRES_APPROVAL" : "REJECTED";
    process.stdout.write(`  ${label} → ${tag} — ${msg}\n`);
  }
}

async function main(): Promise<void> {
  process.stdout.write("scenario: governance limits (mock mode)\n");

  const capped = new Xpense({ mode: "mock", budget: { total: { amount: "1", currency: "USDC" } } });
  await attempt(capped, "spend 0.6 within budget", "0.6", "policy");
  await attempt(capped, "spend 0.6 again, budget now exhausted", "0.6", "policy");

  const wide = new Xpense({ mode: "mock", budget: { total: { amount: "100", currency: "USDC" } } });
  await attempt(wide, "spend 5 under human approval", "5", "human");
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
