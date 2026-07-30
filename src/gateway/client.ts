import type { Money } from "../intent/types.ts";
import type { ChatMessage, ModelUsage } from "../runtime/types.ts";

const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const SAFE_ERROR_CODES = new Set([
  "insufficient_balance",
  "idempotency_conflict",
  "policy_denied",
  "rate_limited",
  "gateway_timeout"
]);

export type GatewayModelProvider = "openrouter";

export interface XAgentGatewayClientOptions {
  /** Private Gateway origin, for example https://api.xagent.example. */
  baseUrl: string;
  /** Short-lived end-user session. Never pass a project secret to this client. */
  sessionToken: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

export interface GatewayChatRequest {
  /** A caller-created business idempotency key. */
  requestId: string;
  /** The developer-selected OpenRouter model, for example openai/gpt-5-mini. */
  model: string;
  /** Defaults to OpenRouter. The Gateway applies the project's provider allowlist. */
  provider?: GatewayModelProvider;
  messages: ChatMessage[];
  /** Optional user-facing maximum. The Gateway calculates and enforces final pricing. */
  maxCharge?: Money;
}

export interface GatewayReceipt {
  receiptId: string;
  charged: Money;
  settledAt: string;
}

export interface GatewayChatResult {
  content: string;
  model: string;
  provider: string;
  usage: ModelUsage;
  receipt: GatewayReceipt;
}

export class XAgentGatewayError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = "XAgentGatewayError";
  }
}

/**
 * Browser/server-safe SDK client for the private Commerce Gateway's public API.
 * It exposes model choice, not provider credentials, balance mutation, or wallet keys.
 */
export class XAgentGatewayClient {
  private readonly baseUrl: URL;
  private readonly fetchFn: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly options: XAgentGatewayClientOptions) {
    this.baseUrl = parseBaseUrl(options?.baseUrl);
    if (!isSafeToken(options?.sessionToken)) {
      throw new TypeError("sessionToken must be a non-empty token without control characters");
    }
    this.fetchFn = options.fetch ?? fetch;
    if (typeof this.fetchFn !== "function") throw new TypeError("fetch must be a function");
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!Number.isSafeInteger(this.timeoutMs) || this.timeoutMs < 1_000) {
      throw new RangeError("timeoutMs must be a safe integer of at least 1000");
    }
  }

  async chat(input: GatewayChatRequest): Promise<GatewayChatResult> {
    validateChatRequest(input);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(new URL("v1/chat/completions", this.baseUrl), {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          authorization: `Bearer ${this.options.sessionToken}`,
          "content-type": "application/json",
          "idempotency-key": input.requestId
        },
        body: JSON.stringify({
          provider: input.provider ?? "openrouter",
          model: input.model,
          messages: input.messages,
          ...(input.maxCharge ? { maxCharge: input.maxCharge } : {})
        })
      });
      const payload = parseJson(await readBoundedText(response, MAX_RESPONSE_BYTES));
      if (!response.ok) throw gatewayError(response.status, payload);
      return parseChatResult(payload);
    } catch (error) {
      if (error instanceof XAgentGatewayError) throw error;
      if (controller.signal.aborted) {
        throw new XAgentGatewayError("Gateway request timed out", 504, "gateway_timeout");
      }
      throw new XAgentGatewayError("Gateway request failed", 503, "gateway_unavailable");
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function createXAgentClient(options: XAgentGatewayClientOptions): XAgentGatewayClient {
  return new XAgentGatewayClient(options);
}

function parseBaseUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("baseUrl must be an absolute URL");
  }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && isLoopback(url.hostname))) {
    throw new TypeError("baseUrl must use HTTPS outside a loopback development environment");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new TypeError("baseUrl must not contain credentials, query, or fragment");
  }
  return new URL(`${url.toString().replace(/\/+$/, "")}/`);
}

function validateChatRequest(input: GatewayChatRequest): void {
  if (!input || !isSafeRequestId(input.requestId) || !isSafeToken(input.model)) {
    throw new TypeError(
      "requestId must be an HTTP-safe token and model must be a non-empty safe string"
    );
  }
  if (input.provider !== undefined && input.provider !== "openrouter") {
    throw new TypeError("provider must be openrouter when specified");
  }
  if (
    !Array.isArray(input.messages) ||
    input.messages.length === 0 ||
    input.messages.length > 100
  ) {
    throw new TypeError("messages must contain between 1 and 100 entries");
  }
  for (const message of input.messages) {
    if (!message || !["system", "user", "assistant", "tool"].includes(message.role)) {
      throw new TypeError("messages contain an unsupported role");
    }
    if (typeof message.content !== "string" || message.content.length > 64 * 1024) {
      throw new TypeError("message content must be a string of at most 65536 characters");
    }
  }
  if (input.maxCharge !== undefined && !validMoney(input.maxCharge)) {
    throw new TypeError("maxCharge must be a non-negative decimal amount and uppercase currency");
  }
}

function parseChatResult(value: unknown): GatewayChatResult {
  const data = value as Partial<GatewayChatResult>;
  if (
    !data ||
    typeof data.content !== "string" ||
    !isSafeToken(data.model) ||
    !isSafeToken(data.provider) ||
    !validUsage(data.usage) ||
    !data.receipt ||
    !isSafeToken(data.receipt.receiptId) ||
    !validMoney(data.receipt.charged) ||
    typeof data.receipt.settledAt !== "string"
  ) {
    throw new XAgentGatewayError(
      "Gateway returned an invalid response",
      502,
      "invalid_gateway_response"
    );
  }
  return data as GatewayChatResult;
}

function gatewayError(status: number, payload: unknown): XAgentGatewayError {
  const error = (payload as { error?: { code?: unknown; message?: unknown; requestId?: unknown } })
    ?.error;
  return new XAgentGatewayError(
    "Gateway rejected the request",
    status,
    typeof error?.code === "string" && SAFE_ERROR_CODES.has(error.code)
      ? error.code
      : "gateway_error",
    typeof error?.requestId === "string" ? error.requestId : undefined
  );
}

function validUsage(value: unknown): value is ModelUsage {
  const usage = value as ModelUsage;
  return (
    !!usage &&
    [usage.inputTokens, usage.outputTokens, usage.totalTokens].every(
      (count) => Number.isSafeInteger(count) && count >= 0
    ) &&
    usage.totalTokens === usage.inputTokens + usage.outputTokens
  );
}

function validMoney(value: unknown): value is Money {
  const money = value as Money;
  return (
    !!money &&
    typeof money.amount === "string" &&
    /^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(money.amount) &&
    typeof money.currency === "string" &&
    /^[A-Z0-9-]{2,16}$/.test(money.currency)
  );
}

function isSafeToken(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 256 &&
    !/[\u0000\r\n]/.test(value)
  );
}

function isSafeRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

async function readBoundedText(response: Response, maxBytes: number): Promise<string> {
  const length = Number(response.headers.get("content-length"));
  if (Number.isSafeInteger(length) && length > maxBytes)
    throw new XAgentGatewayError("Gateway response is too large", 502, "invalid_gateway_response");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        void reader.cancel().catch(() => undefined);
        throw new XAgentGatewayError(
          "Gateway response is too large",
          502,
          "invalid_gateway_response"
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function isLoopback(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}
