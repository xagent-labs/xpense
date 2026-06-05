import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { OnchainosGateway } from "../src/settlement/onchainos.ts";

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

test("OnchainosGateway sends correct payloads to xerpaai-go /user/onchainos/*", async () => {
  const mock = await startMockXerpaaiGo();
  const gw = new OnchainosGateway({ baseUrl: mock.baseUrl, accessToken: "jwt-e2e" });

  const status = await gw.walletStatus();
  expect(status.loggedIn).toBe(true);

  const sign = await gw.x402Sign({
    accepts: [{ scheme: "exact", amount: "0.10", currency: "USDC" }],
    resource: "/api/inference"
  });
  expect(sign.authorizationHeader).toBe("0xsig");

  const charge = await gw.mppCharge({ challenge: "chal-1", from: "0xabc" });
  expect(charge.wallet).toBe("0xabc");

  for (const c of mock.captured) {
    expect(c.url).toContain("/user/onchainos/");
    expect(c.auth).toBe("Bearer jwt-e2e");
    expect(c.method).toBe("POST");
  }

  console.log("\n=== payloads xpense sent to xerpaai-go ===");
  for (const c of mock.captured) {
    console.log(`POST ${c.url}`);
    console.log(`  authorization: ${c.auth}`);
    console.log(`  body: ${JSON.stringify(c.body)}`);
  }

  await mock.close();
});
