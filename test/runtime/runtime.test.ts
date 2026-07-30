import { describe, expect, it, vi } from "vitest";
import { InMemoryBilling } from "../../src/runtime/in-memory-billing.ts";
import { createXAgent } from "../../src/runtime/runtime.ts";
import {
  IdempotencyConflictError,
  IndeterminateExecutionError,
  ModelCallError,
  SettlementError,
  SettlementPendingError,
  SettlementRecoveryRequiredError,
  type BillingPort,
  type ModelCompletion,
  type ModelProvider
} from "../../src/runtime/types.ts";

const userId = "user_123";
const projectId = "proj_vibe";

function completion(overrides: Partial<ModelCompletion> = {}): ModelCompletion {
  return {
    content: "Hello from X-Agent",
    model: "gpt-5",
    provider: "gateway",
    providerRequestId: "provider_req_001",
    deliveryId: "delivery_001",
    usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    actualCharge: { amount: "0.03", currency: "USD" },
    ...overrides
  };
}

function request(overrides: Record<string, unknown> = {}) {
  return {
    requestId: "req_001",
    userId,
    projectId,
    model: "auto",
    messages: [{ role: "user" as const, content: "Hello" }],
    maxCharge: { amount: "0.05", currency: "USD" },
    ...overrides
  };
}

function fundedBilling(amount = "1"): InMemoryBilling {
  const billing = new InMemoryBilling();
  billing.credit(projectId, userId, { amount, currency: "USD" });
  return billing;
}

describe("XAgentRuntime", () => {
  it("reserves before invoking a model, settles actual usage, and returns a receipt", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    const result = await ai.chat(request());

    expect(result.content).toBe("Hello from X-Agent");
    expect(result.receipt.charged).toEqual({ amount: "0.03", currency: "USD" });
    expect(model.chat).toHaveBeenCalledTimes(1);
    expect(billing.balance(projectId, userId, "USD")).toMatchObject({
      credited: "1",
      reserved: "0",
      settled: "0.03",
      available: "0.97"
    });
    expect(billing.auditEvents().map((event) => event.type)).toEqual([
      "credited",
      "reserved",
      "settled"
    ]);
  });

  it("denies insufficient funds before the model provider is invoked", async () => {
    const billing = fundedBilling("0.01");
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toThrow(/insufficient available balance/);
    expect(model.chat).not.toHaveBeenCalled();
  });

  it("single-flights equal concurrent requests and returns the settled result on later retries", async () => {
    const billing = fundedBilling();
    let resolveModel: ((value: ModelCompletion) => void) | undefined;
    const model: ModelProvider = {
      chat: vi.fn(
        () =>
          new Promise<ModelCompletion>((resolve) => {
            resolveModel = resolve;
          })
      )
    };
    const ai = createXAgent({ model, billing });

    const first = ai.chat(request());
    const second = ai.chat(request());
    await vi.waitFor(() => expect(model.chat).toHaveBeenCalledTimes(1));
    resolveModel?.(completion());

    const [firstResult, secondResult] = await Promise.all([first, second]);
    const thirdResult = await ai.chat(request());
    expect(firstResult.receipt.receiptId).toBe(secondResult.receipt.receiptId);
    expect(thirdResult.receipt.receiptId).toBe(firstResult.receipt.receiptId);
    expect(model.chat).toHaveBeenCalledTimes(1);
  });

  it("gives identical but independent requests distinct provider idempotency keys", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await ai.chat(request({ requestId: "req_001" }));
    await ai.chat(request({ requestId: "req_002" }));

    const firstCall = vi.mocked(model.chat).mock.calls[0]![0];
    const secondCall = vi.mocked(model.chat).mock.calls[1]![0];
    expect(firstCall.providerIdempotencyKey).not.toBe(secondCall.providerIdempotencyKey);
    expect(model.chat).toHaveBeenCalledTimes(2);
  });

  it("rejects a reused idempotency key with changed request data without calling the provider", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });
    await ai.chat(request());

    await expect(
      ai.chat(request({ messages: [{ role: "user", content: "Different prompt" }] }))
    ).rejects.toBeInstanceOf(IdempotencyConflictError);
    expect(model.chat).toHaveBeenCalledTimes(1);
  });

  it("releases a reservation only after a provider confirms it did not execute", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = {
      chat: vi.fn(async () => {
        throw new ModelCallError("provider rejected the request", "not_executed");
      })
    };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(ModelCallError);
    expect(billing.balance(projectId, userId, "USD")).toMatchObject({
      reserved: "0",
      available: "1"
    });
    expect(billing.auditEvents().map((event) => event.type)).toEqual([
      "credited",
      "reserved",
      "released"
    ]);
  });

  it("safely re-reserves and retries after a definitively unexecuted provider failure", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = {
      chat: vi
        .fn<() => Promise<ModelCompletion>>()
        .mockRejectedValueOnce(new ModelCallError("provider rejected the request", "not_executed"))
        .mockResolvedValueOnce(completion())
    };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(ModelCallError);
    await expect(ai.chat(request())).resolves.toMatchObject({ content: "Hello from X-Agent" });
    expect(model.chat).toHaveBeenCalledTimes(2);
    expect(billing.balance(projectId, userId, "USD")).toMatchObject({
      reserved: "0",
      settled: "0.03"
    });
  });

  it("retains an unknown provider outcome and blocks a duplicate provider call", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = {
      chat: vi.fn(async () => {
        throw new ModelCallError("provider timed out", "unknown");
      })
    };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(ModelCallError);
    await expect(ai.chat(request())).rejects.toBeInstanceOf(IndeterminateExecutionError);
    expect(model.chat).toHaveBeenCalledTimes(1);
    expect(billing.balance(projectId, userId, "USD")).toMatchObject({
      reserved: "0.05",
      available: "0.95"
    });
  });

  it("retries settlement without invoking the model again after a transient billing failure", async () => {
    const memory = fundedBilling();
    const settle = vi
      .fn(memory.settle.bind(memory))
      .mockRejectedValueOnce(new SettlementError("ledger temporarily unavailable", "retryable"));
    const billing: BillingPort = {
      reserve: memory.reserve.bind(memory),
      settle,
      release: memory.release.bind(memory)
    };
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(SettlementPendingError);
    const result = await ai.chat(request());

    expect(result.receipt.charged.amount).toBe("0.03");
    expect(model.chat).toHaveBeenCalledTimes(1);
    expect(settle).toHaveBeenCalledTimes(2);
  });

  it("requires recovery rather than repeatedly settling a permanent billing failure", async () => {
    const memory = fundedBilling();
    const settle = vi
      .fn(memory.settle.bind(memory))
      .mockRejectedValue(new SettlementError("ledger conflict", "permanent"));
    const billing: BillingPort = {
      reserve: memory.reserve.bind(memory),
      settle,
      release: memory.release.bind(memory)
    };
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(SettlementRecoveryRequiredError);
    await expect(ai.chat(request())).rejects.toBeInstanceOf(SettlementRecoveryRequiredError);
    expect(model.chat).toHaveBeenCalledTimes(1);
    expect(settle).toHaveBeenCalledTimes(1);
  });

  it("fails closed when a billing adapter returns a receipt for a different settlement", async () => {
    const memory = fundedBilling();
    const billing: BillingPort = {
      reserve: memory.reserve.bind(memory),
      release: memory.release.bind(memory),
      settle: async (input) => {
        const receipt = await memory.settle(input);
        return { ...receipt, deliveryId: "different_delivery" };
      }
    };
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toBeInstanceOf(SettlementRecoveryRequiredError);
    await expect(ai.chat(request())).rejects.toBeInstanceOf(SettlementRecoveryRequiredError);
    expect(model.chat).toHaveBeenCalledTimes(1);
  });

  it("does not let a balance credited in one project fund another project", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = { chat: vi.fn(async () => completion()) };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request({ projectId: "proj_other" }))).rejects.toThrow(
      /insufficient available balance/
    );
    expect(model.chat).not.toHaveBeenCalled();
  });

  it("rejects model usage that exceeds the reservation and does not return content", async () => {
    const billing = fundedBilling();
    const model: ModelProvider = {
      chat: vi.fn(async () => completion({ actualCharge: { amount: "0.06", currency: "USD" } }))
    };
    const ai = createXAgent({ model, billing });

    await expect(ai.chat(request())).rejects.toThrow(/exceeds the reserved maximum/);
    expect(billing.balance(projectId, userId, "USD")).toMatchObject({
      reserved: "0.05",
      settled: "0"
    });
  });
});
