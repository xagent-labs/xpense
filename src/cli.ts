import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { Xpense } from "./agent/xpense.ts";
import type { AuthMode } from "./access/login.ts";
import type { ApprovalMode, SettlementScheme } from "./intent/types.ts";

const C = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m"
};

interface SpendParams {
  amount: string;
  currency: string;
  reason: string;
  counterparty: string;
  budgetTotal: string;
  approval: string;
  scheme: string;
}

const DEFAULTS: SpendParams = {
  amount: "0.25",
  currency: "USDC",
  reason: "Weather data API call",
  counterparty: "weatherapi.com",
  budgetTotal: "1",
  approval: "policy",
  scheme: "exact"
};

function settlementPreview(p: SpendParams) {
  if (p.scheme === "voucher" || p.scheme === "stream") {
    return {
      endpoint: "POST /user/onchainos/mpp/charge",
      body: { challenge: "<from 402/MPP challenge>", from: "<wallet address>" }
    };
  }
  return {
    endpoint: "POST /user/onchainos/x402/sign",
    body: {
      accepts: [{ scheme: "exact", amount: p.amount, currency: p.currency }],
      resource: p.counterparty
    }
  };
}

async function runSpend(p: SpendParams) {
  const budget = p.budgetTotal ? { total: { amount: p.budgetTotal, currency: p.currency } } : {};
  const xp = new Xpense({ mode: "mock", budget });
  const intent = xp.createPaymentIntent({
    reason: { category: "demo", description: p.reason },
    counterparty: { kind: "api", name: p.counterparty },
    amount: { kind: "fixed", value: { amount: p.amount, currency: p.currency } },
    approval: { mode: p.approval as ApprovalMode },
    policy: {},
    scheme: p.scheme as SettlementScheme
  });

  let outcome = "authorized";
  let submit: unknown = null;
  let errorMsg: string | null = null;
  try {
    submit = await xp.submitPaymentIntent(intent);
  } catch (error) {
    errorMsg = error instanceof Error ? error.message : String(error);
    outcome = /approval/i.test(errorMsg) ? "requires_approval" : "rejected";
  }
  return { outcome, intent, submit, errorMsg, settlement: settlementPreview(p) };
}

function printResult(r: Awaited<ReturnType<typeof runSpend>>): void {
  const tone = r.outcome === "authorized" ? C.green : r.outcome === "rejected" ? C.red : C.yellow;
  stdout.write(
    `\n${tone}${C.bold}● ${r.outcome.toUpperCase()}${C.reset}${r.errorMsg ? ` ${C.dim}— ${r.errorMsg}${C.reset}` : ""}\n`
  );
  stdout.write(`\n${C.dim}Payment Intent${C.reset}\n${JSON.stringify(r.intent, null, 2)}\n`);
  stdout.write(
    `\n${C.dim}Settlement (live → xerpaai-go)${C.reset}\n  ${r.settlement.endpoint}\n  ${JSON.stringify(r.settlement.body)}\n`
  );
  stdout.write(`\n${C.dim}submit()${C.reset} ${JSON.stringify(r.submit)}\n`);
}

function parseFlags(argv: string[]): Partial<SpendParams> {
  const map: Record<string, keyof SpendParams> = {
    "--amount": "amount",
    "--currency": "currency",
    "--reason": "reason",
    "--counterparty": "counterparty",
    "--budget": "budgetTotal",
    "--approval": "approval",
    "--scheme": "scheme"
  };
  const out: Partial<SpendParams> = {};
  for (let i = 0; i < argv.length - 1; i += 1) {
    const key = map[argv[i]];
    if (key) {
      out[key] = argv[i + 1];
    }
  }
  return out;
}

async function bench(argv: string[]): Promise<number> {
  const flags = parseFlags(argv);

  if (Object.keys(flags).length > 0) {
    printResult(await runSpend({ ...DEFAULTS, ...flags }));
    return 0;
  }

  const rl = createInterface({ input: stdin, output: stdout });
  const ask = async (q: string, def: string): Promise<string> =>
    (await rl.question(`${C.cyan}${q}${C.reset} ${C.dim}[${def}]${C.reset}: `)).trim() || def;

  stdout.write(
    `${C.bold}xpense bench${C.reset} ${C.dim}— mock mode, nothing real moves${C.reset}\n`
  );
  let again = true;
  while (again) {
    stdout.write("\n");
    const p: SpendParams = {
      amount: await ask("amount", DEFAULTS.amount),
      currency: await ask("currency", DEFAULTS.currency),
      reason: await ask("reason", DEFAULTS.reason),
      counterparty: await ask("counterparty", DEFAULTS.counterparty),
      budgetTotal: await ask("budget total (blank = unlimited)", DEFAULTS.budgetTotal),
      approval: await ask("approval (policy|auto|human)", DEFAULTS.approval),
      scheme: await ask("scheme (exact|voucher|stream)", DEFAULTS.scheme)
    };
    printResult(await runSpend(p));
    const more = (await rl.question(`\n${C.cyan}another?${C.reset} (y/N): `)).trim().toLowerCase();
    again = more === "y" || more === "yes";
  }
  rl.close();
  return 0;
}

async function main(argv: string[]): Promise<number> {
  const cmd = argv[0] ?? "help";

  if (cmd === "bench") {
    return bench(argv.slice(1));
  }

  const xp = new Xpense();

  if (cmd === "login") {
    const mode: AuthMode = argv.includes("--loopback")
      ? "loopback"
      : argv.includes("--device")
        ? "device"
        : "paste";
    const { userId } = await xp.login(mode);
    process.stdout.write(`Logged in as ${userId}\n`);
    return 0;
  }

  if (cmd === "whoami") {
    const creds = await xp.whoami();
    process.stdout.write(creds ? `${creds.userId}\n` : "not logged in\n");
    return creds ? 0 : 1;
  }

  if (cmd === "logout") {
    await xp.logout();
    process.stdout.write("logged out\n");
    return 0;
  }

  process.stdout.write(
    "usage: xpense <bench|login|whoami|logout>\n" +
      "  bench [--amount N --currency USDC --budget N --approval policy|auto|human --scheme exact|voucher|stream]\n" +
      "        no flags → interactive\n"
  );
  return cmd === "help" ? 0 : 1;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  });
