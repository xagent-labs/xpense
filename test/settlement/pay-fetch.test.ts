import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createPayFetch,
  PaymentChallengeTooLargeError,
  UnsafePaymentReplayError
} from "../../src/settlement/pay-fetch.ts";

afterEach(() => vi.unstubAllGlobals());

function paymentRequired(body: unknown = { accepts: [{ scheme: "exact" }] }): Response {
  return new Response(JSON.stringify(body), {
    status: 402,
    headers: {
      "content-type": "application/json",
      "payment-required": "x402"
    }
  });
}

describe("createPayFetch", () => {
  it("passes a bounded 402 challenge to policy and retries exactly once with the credential", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(paymentRequired({ accepts: [{ amount: "0.01", asset: "USDC" }] }))
      .mockResolvedValueOnce(new Response("delivered", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const onPaymentRequired = vi.fn(async (challenge, request) => {
      expect(challenge.status).toBe(402);
      expect(challenge.headers["payment-required"]).toBe("x402");
      expect(challenge.body).toEqual({ accepts: [{ amount: "0.01", asset: "USDC" }] });
      expect(request.idempotencyKey).toBe("request-123");
      expect(request.attempt).toBe(1);
      return { headers: { "X-PAYMENT": "credential" } };
    });

    const payFetch = createPayFetch({ onPaymentRequired });
    const response = await payFetch("https://provider.example/resource", {
      headers: { "Idempotency-Key": "request-123" }
    });

    expect(await response.text()).toBe("delivered");
    expect(onPaymentRequired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const original = fetchMock.mock.calls[0]![0] as Request;
    const retry = fetchMock.mock.calls[1]![0] as Request;
    expect(original.headers.get("Idempotency-Key")).toBe("request-123");
    expect(retry.headers.get("Idempotency-Key")).toBe("request-123");
    expect(retry.headers.get("X-PAYMENT")).toBe("credential");
  });

  it("keeps the original 402 response when policy does not issue a credential", async () => {
    const response402 = paymentRequired();
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(response402);
    vi.stubGlobal("fetch", fetchMock);

    const payFetch = createPayFetch({ onPaymentRequired: async () => undefined });
    const response = await payFetch("https://provider.example/resource");

    expect(response).toBe(response402);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never retries a paid challenge twice when the retry is still 402", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(paymentRequired())
      .mockResolvedValueOnce(paymentRequired());
    vi.stubGlobal("fetch", fetchMock);

    const onPaymentRequired = vi.fn(async () => ({ headers: { "X-PAYMENT": "credential" } }));
    const payFetch = createPayFetch({ onPaymentRequired });
    const response = await payFetch("https://provider.example/resource");

    expect(response.status).toBe(402);
    expect(onPaymentRequired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("refuses an unsafe replay without an explicit idempotency key and opt-in", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(paymentRequired());
    vi.stubGlobal("fetch", fetchMock);
    const onPaymentRequired = vi.fn(async () => ({ headers: { "X-PAYMENT": "credential" } }));

    const payFetch = createPayFetch({
      onPaymentRequired
    });

    await expect(
      payFetch("https://provider.example/resource", { method: "POST", body: "task" })
    ).rejects.toBeInstanceOf(UnsafePaymentReplayError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onPaymentRequired).not.toHaveBeenCalled();
  });

  it("retries an unsafe request once only when the caller opts in with an idempotency key", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(paymentRequired())
      .mockResolvedValueOnce(new Response("delivered", { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const payFetch = createPayFetch({
      allowUnsafeReplay: true,
      onPaymentRequired: async () => ({ headers: { "X-PAYMENT": "credential" } })
    });
    const response = await payFetch("https://provider.example/resource", {
      method: "POST",
      body: "task",
      headers: { "Idempotency-Key": "request-456" }
    });

    expect(response.status).toBe(201);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retry = fetchMock.mock.calls[1]![0] as Request;
    expect(retry.headers.get("Idempotency-Key")).toBe("request-456");
  });

  it("rejects an oversized challenge before policy or wallet code can consume it", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(paymentRequired({ quote: "x".repeat(128) }));
    vi.stubGlobal("fetch", fetchMock);
    const onPaymentRequired = vi.fn(async () => ({ headers: { "X-PAYMENT": "credential" } }));
    const payFetch = createPayFetch({ onPaymentRequired, maxChallengeBytes: 64 });

    await expect(payFetch("https://provider.example/resource")).rejects.toBeInstanceOf(
      PaymentChallengeTooLargeError
    );
    expect(onPaymentRequired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not invoke policy after a redirect changes the effective payment URL", async () => {
    const redirectedChallenge = paymentRequired();
    Object.defineProperty(redirectedChallenge, "url", {
      value: "https://other-provider.example/resource"
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(redirectedChallenge);
    vi.stubGlobal("fetch", fetchMock);
    const onPaymentRequired = vi.fn(async () => ({ headers: { "X-PAYMENT": "credential" } }));

    const payFetch = createPayFetch({ onPaymentRequired });
    await expect(payFetch("https://provider.example/resource")).rejects.toBeInstanceOf(
      UnsafePaymentReplayError
    );

    expect(onPaymentRequired).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("cancels an oversized streaming challenge on both response branches", async () => {
    let cancelled = false;
    const body = new ReadableStream({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(128)));
      },
      cancel() {
        cancelled = true;
      }
    });
    const response402 = new Response(body, {
      status: 402,
      headers: { "content-type": "text/plain" }
    });
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(response402);
    vi.stubGlobal("fetch", fetchMock);

    const payFetch = createPayFetch({
      maxChallengeBytes: 64,
      onPaymentRequired: async () => ({ headers: { "X-PAYMENT": "credential" } })
    });
    await expect(payFetch("https://provider.example/resource")).rejects.toBeInstanceOf(
      PaymentChallengeTooLargeError
    );
    await vi.waitFor(() => expect(cancelled).toBe(true));
  });

  it("does not let a payment credential replace the original idempotency key", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(paymentRequired());
    vi.stubGlobal("fetch", fetchMock);
    const payFetch = createPayFetch({
      onPaymentRequired: async () => ({ headers: { "Idempotency-Key": "different-request" } })
    });

    await expect(
      payFetch("https://provider.example/resource", {
        headers: { "Idempotency-Key": "request-789" }
      })
    ).rejects.toBeInstanceOf(UnsafePaymentReplayError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
