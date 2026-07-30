import { afterEach, describe, expect, it, vi } from "vitest";
import { createXAgentClient, XAgentGatewayError } from "../../src/gateway/client.ts";

afterEach(() => vi.unstubAllGlobals());

function completion(): Response {
  return Response.json({
    content: "Hello",
    model: "openai/gpt-5-mini",
    provider: "openrouter",
    usage: { inputTokens: 4, outputTokens: 2, totalTokens: 6 },
    receipt: {
      receiptId: "rcpt_123",
      charged: { amount: "0.02", currency: "USD" },
      settledAt: "2026-07-30T00:00:00.000Z"
    }
  });
}

describe("XAgentGatewayClient", () => {
  it("sends the developer-selected OpenRouter model with a session token and idempotency key", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(completion());
    vi.stubGlobal("fetch", fetchMock);
    const client = createXAgentClient({
      baseUrl: "https://gateway.example/",
      sessionToken: "session_short_lived"
    });

    const result = await client.chat({
      requestId: "chat_001",
      provider: "openrouter",
      model: "openai/gpt-5-mini",
      messages: [{ role: "user", content: "Hello" }]
    });

    expect(result.receipt.charged.amount).toBe("0.02");
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.toString()).toBe("https://gateway.example/v1/chat/completions");
    expect(init?.headers).toMatchObject({
      authorization: "Bearer session_short_lived",
      "idempotency-key": "chat_001"
    });
    expect(JSON.parse(init?.body as string)).toMatchObject({
      provider: "openrouter",
      model: "openai/gpt-5-mini"
    });
  });

  it("rejects insecure non-loopback Gateway origins", () => {
    expect(() =>
      createXAgentClient({ baseUrl: "http://gateway.example", sessionToken: "session" })
    ).toThrow(/HTTPS/);
  });

  it("maps safe Gateway errors without exposing raw transport failures", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      Response.json(
        {
          error: {
            code: "insufficient_balance",
            message: "Insufficient balance",
            requestId: "gw_1"
          }
        },
        { status: 402 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = createXAgentClient({
      baseUrl: "https://gateway.example",
      sessionToken: "session"
    });

    await expect(
      client.chat({
        requestId: "chat_002",
        model: "openai/gpt-5-mini",
        messages: [{ role: "user", content: "Hi" }]
      })
    ).rejects.toMatchObject<XAgentGatewayError>({
      status: 402,
      code: "insufficient_balance",
      requestId: "gw_1"
    });
  });
});
