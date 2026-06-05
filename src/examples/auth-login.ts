import { Xpense } from "../agent/xpense.ts";

async function main(): Promise<void> {
  const xp = new Xpense();
  const { userId } = await xp.login("paste");
  process.stdout.write(`Logged in as ${userId}\n`);
  const me = await xp.whoami();
  process.stdout.write(`whoami: ${me?.userId ?? "none"}\n`);
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
