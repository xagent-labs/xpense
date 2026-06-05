import { createServer } from "node:http";
import { OnchainosGateway } from "../index.ts";

interface Captured {
  method: string;
  url: string;
  auth?: string;
  body: unknown;
}

async function startMockXerpaaiGo(): Promise<{
  baseUrl: string;
  captured: Captured[];
  close: () => Promise<void>;
}> {
  const captured: Captured[] = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      captured.push({
        method: req.method ?? "",
        url: req.url ?? "",
        auth: req.headers.authorization,
        body: raw ? JSON.parse(raw) : undefined
      });
      let data: unknown = {};
      if (req.url?.endsWith("/wallet/status")) {
        data = { loggedIn: true, addresses: [{ chainIndex: "1", address: "0xabc" }] };
      } else if (req.url?.endsWith("/x402/sign")) {
        data = { headerName: "X-PAYMENT", authorizationHeader: "0xsig" };
      } else if (req.url?.endsWith("/mpp/charge")) {
        data = {
          protocol: "mpp",
          method: "charge",
          intent: "pay",
          mode: "live",
          authorizationHeader: "0xsig",
          wallet: "0xabc"
        };
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ success: true, code: 0, data }));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const addr = server.address() as { port: number };
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    captured,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

async function main(): Promise<void> {
  process.stdout.write("scenario: settlement via xerpaai-go onchainos (mock server)\n\n");
  const mock = await startMockXerpaaiGo();
  const gw = new OnchainosGateway({ baseUrl: mock.baseUrl, accessToken: "jwt-demo" });

  await gw.walletStatus();
  await gw.x402Sign({
    accepts: [{ scheme: "exact", amount: "0.10", currency: "USDC" }],
    resource: "/api/inference"
  });
  await gw.mppCharge({ challenge: "chal-1", from: "0xabc" });

  for (const c of mock.captured) {
    process.stdout.write(`${c.method} ${c.url}\n`);
    process.stdout.write(`  authorization: ${c.auth}\n`);
    process.stdout.write(`  body: ${JSON.stringify(c.body)}\n`);
  }

  await mock.close();
}

main().catch((err) => {
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
