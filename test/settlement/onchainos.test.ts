import { describe, it, expect, vi, afterEach } from "vitest";
import { OnchainosGateway } from "../../src/settlement/onchainos.ts";

function mockFetch(data: unknown) {
  const fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ success: true, code: 0, data })
  }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

const gw = new OnchainosGateway({
  baseUrl: "https://api.xerpaai.com",
  accessToken: "jwt-123"
});

describe("OnchainosGateway", () => {
  it("posts wallet/status and unwraps the envelope data", async () => {
    const fetchMock = mockFetch({ loggedIn: true, addresses: [{ chainIndex: "1" }] });
    const status = await gw.walletStatus();

    expect(status.loggedIn).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toBe("https://api.xerpaai.com/user/onchainos/wallet/status");
    expect(init!.method).toBe("POST");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer jwt-123");
  });

  it("signs an x402 challenge and returns the authorization header", async () => {
    mockFetch({ headerName: "X-PAYMENT", authorizationHeader: "deadbeef" });
    const result = await gw.x402Sign({ accepts: [{ scheme: "exact" }], resource: "/api/x" });
    expect(result.authorizationHeader).toBe("deadbeef");
  });

  it("charges an mpp challenge", async () => {
    const fetchMock = mockFetch({
      protocol: "mpp",
      method: "charge",
      intent: "pay",
      mode: "live",
      authorizationHeader: "sig",
      wallet: "0xabc"
    });
    const result = await gw.mppCharge({ challenge: "chal-1" });
    expect(result.wallet).toBe("0xabc");
    expect(String(fetchMock.mock.calls[0]![0])).toBe(
      "https://api.xerpaai.com/user/onchainos/mpp/charge"
    );
  });
});
