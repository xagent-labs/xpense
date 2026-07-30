const DEFAULT_MAX_CHALLENGE_BYTES = 64 * 1024;
const SAFE_REPLAY_METHODS = new Set(["GET", "HEAD"]);
const FORBIDDEN_CREDENTIAL_HEADERS = new Set([
  "connection",
  "content-length",
  "cookie",
  "host",
  "idempotency-key",
  "proxy-authorization",
  "set-cookie",
  "transfer-encoding"
]);

export interface PaymentChallenge {
  status: 402;
  /** Payment-specific response headers, normalized to lower case. */
  headers: Record<string, string>;
  /** Parsed JSON when the challenge is JSON; otherwise bounded text. */
  body: unknown;
}

export interface PaymentRequiredRequest {
  url: string;
  method: string;
  /** Caller-supplied business idempotency key, when present. */
  idempotencyKey?: string;
  /** The wrapper permits exactly one credential-backed retry. */
  attempt: 1;
}

export interface PaymentCredential {
  /**
   * Payment proof returned by a trusted policy/wallet integration, for example
   * `{ "X-PAYMENT": signature }` from `OnchainosGateway.x402Sign`.
   */
  headers: HeadersInit;
}

export interface PayFetchOptions {
  /**
   * This callback owns authorization and wallet interaction. Returning nothing
   * keeps the original 402 response for a manual path; returning headers retries once.
   */
  onPaymentRequired: (
    challenge: PaymentChallenge,
    request: PaymentRequiredRequest
  ) => Promise<PaymentCredential | void>;
  /**
   * Non-safe methods are never replayed without an explicit opt-in and an
   * existing `Idempotency-Key` header on the original request.
   */
  allowUnsafeReplay?: boolean;
  /** Maximum bytes retained from a 402 challenge body. Defaults to 64 KiB. */
  maxChallengeBytes?: number;
}

export class UnsafePaymentReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafePaymentReplayError";
  }
}

export class PaymentChallengeTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`payment challenge exceeds the configured ${maxBytes}-byte limit`);
    this.name = "PaymentChallengeTooLargeError";
  }
}

/**
 * Wrap `fetch` with one bounded, policy-controlled 402 payment retry.
 * xpense never creates a credential or signs here; the caller supplies a
 * credential only after it has authorized the challenge.
 */
export function createPayFetch(opts: PayFetchOptions): typeof fetch {
  validateOptions(opts);

  const wrapped = async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> => {
    const originalRequest = new Request(input, init);
    const replayRequest = cloneForReplay(originalRequest);
    const response = await fetch(originalRequest);
    if (response.status !== 402) return response;

    const idempotencyKey = originalRequest.headers.get("Idempotency-Key") ?? undefined;
    assertRetryAllowed(
      originalRequest,
      replayRequest,
      opts.allowUnsafeReplay === true,
      idempotencyKey
    );
    assertChallengeTarget(originalRequest, response);

    const challenge = await readPaymentChallenge(
      response,
      opts.maxChallengeBytes ?? DEFAULT_MAX_CHALLENGE_BYTES
    );
    const credential = await opts.onPaymentRequired(challenge, {
      url: originalRequest.url,
      method: originalRequest.method,
      idempotencyKey,
      attempt: 1
    });

    if (!credential) return response;
    const headers = mergeCredentialHeaders(replayRequest.headers, credential.headers);
    return fetch(new Request(replayRequest, { headers }));
  };

  return wrapped as typeof fetch;
}

function validateOptions(opts: PayFetchOptions): void {
  if (typeof opts?.onPaymentRequired !== "function") {
    throw new TypeError("onPaymentRequired must be a function");
  }
  if (
    opts.maxChallengeBytes !== undefined &&
    (!Number.isSafeInteger(opts.maxChallengeBytes) || opts.maxChallengeBytes <= 0)
  ) {
    throw new RangeError("maxChallengeBytes must be a positive safe integer");
  }
}

function cloneForReplay(request: Request): Request | undefined {
  try {
    return request.clone();
  } catch {
    return undefined;
  }
}

function assertRetryAllowed(
  request: Request,
  replayRequest: Request | undefined,
  allowUnsafeReplay: boolean,
  idempotencyKey: string | undefined
): asserts replayRequest is Request {
  if (!replayRequest) {
    throw new UnsafePaymentReplayError("request body cannot be replayed safely");
  }
  if (SAFE_REPLAY_METHODS.has(request.method)) return;
  if (!allowUnsafeReplay) {
    throw new UnsafePaymentReplayError(
      `${request.method} payment retry requires allowUnsafeReplay: true`
    );
  }
  if (!idempotencyKey) {
    throw new UnsafePaymentReplayError(
      `${request.method} payment retry requires a caller-supplied Idempotency-Key header`
    );
  }
}

function assertChallengeTarget(request: Request, response: Response): void {
  // Synthetic Response instances do not expose a URL. Real fetch responses do.
  if (response.url && response.url !== request.url) {
    throw new UnsafePaymentReplayError(
      "automatic payment retry is disabled after a redirect or effective URL change"
    );
  }
}

function mergeCredentialHeaders(existing: Headers, credentialHeaders: HeadersInit): Headers {
  const credential = new Headers(credentialHeaders);
  if ([...credential.keys()].length === 0) {
    throw new TypeError("payment credential must contain at least one header");
  }

  const headers = new Headers(existing);
  for (const [name, value] of credential) {
    const normalized = name.toLowerCase();
    if (FORBIDDEN_CREDENTIAL_HEADERS.has(normalized) || normalized.startsWith("proxy-")) {
      throw new UnsafePaymentReplayError(`payment credential may not set ${name}`);
    }
    if (/[\u0000\r\n]/.test(value)) {
      throw new TypeError(`payment credential header ${name} contains an invalid value`);
    }
    headers.set(name, value);
  }
  return headers;
}

async function readPaymentChallenge(
  response: Response,
  maxBytes: number
): Promise<PaymentChallenge> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isSafeInteger(contentLength) && contentLength > maxBytes) {
    void response.body?.cancel().catch(() => undefined);
    throw new PaymentChallengeTooLargeError(maxBytes);
  }
  const cloned = response.clone();
  const text = await readBoundedText(cloned, maxBytes, response);
  const contentType = cloned.headers.get("content-type") ?? "";
  return {
    status: 402,
    headers: paymentHeaders(cloned.headers),
    body: parseChallengeBody(text, contentType)
  };
}

function paymentHeaders(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [name, value] of headers) {
    const normalized = name.toLowerCase();
    if (
      normalized === "content-type" ||
      normalized === "www-authenticate" ||
      normalized.startsWith("payment-") ||
      normalized.startsWith("x-payment-")
    ) {
      result[normalized] = value;
    }
  }
  return result;
}

async function readBoundedText(
  response: Response,
  maxBytes: number,
  originalResponse: Response
): Promise<string> {
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
        // A tee'd Response clone may wait for the original consumer while
        // cancelling. Cancel both branches without waiting, so the bounded
        // parser cannot leave an attacker-controlled stream running.
        void reader.cancel().catch(() => undefined);
        void originalResponse.body?.cancel().catch(() => undefined);
        throw new PaymentChallengeTooLargeError(maxBytes);
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

function parseChallengeBody(text: string, contentType: string): unknown {
  if (!text) return {};
  if (/\b(?:application|text)\/(?:[\w.+-]+\+)?json\b/i.test(contentType)) {
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  }
  return text;
}
