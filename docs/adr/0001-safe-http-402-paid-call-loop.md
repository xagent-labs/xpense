# ADR 0001: Safe HTTP 402 paid-call loop

**Status:** Accepted — 2026-07-30
**Owner:** X-Agent / xpense maintainers

## Context

`createPayFetch` currently detects an HTTP 402 response and invokes a callback, but it returns the original response. This makes a paid capability call incomplete: an agent cannot consume the resource after policy and wallet infrastructure provide payment proof.

The change crosses a payment boundary. A retry must never create a second charge, must not turn the SDK into a key holder, and must not make an arbitrary HTTP body replayable by default.

## Decision

`createPayFetch` will:

1. Read a bounded, payment-relevant 402 challenge from a clone of the response.
2. Pass the challenge to an application-owned `onPaymentRequired` callback. The callback owns policy evaluation and calls the wallet/backend; xpense receives only headers for the retry.
3. Retry the original request at most once when the callback returns a credential.
4. Retry `GET` and `HEAD` by default. A non-safe method requires both `allowUnsafeReplay: true` and a caller-supplied `Idempotency-Key` header.
5. Return the first eligible 402 unchanged when no credential is returned, preserving the existing manual-settlement path. Return a second 402 unchanged rather than invoking policy again.
6. Reject automatic payment after a redirect or effective URL change, and preflight unsafe retries before policy or wallet interaction.

The retry rejects forbidden transport headers such as `Host`, `Content-Length`, `Cookie`, and `Idempotency-Key`. The original idempotency key is preserved and cannot be overwritten by a credential.

## Consequences

- The SDK remains protocol-neutral and never accesses a wallet private key.
- Applications have an explicit, testable handoff from challenge to policy/wallet implementation.
- POST-style paid calls are opt-in, idempotent, and bounded to one retry.
- Persistent Intent / Decision / Attempt / Receipt / Delivery storage, distributed reservations, and reconciliation remain separate P0/P1 work; this SDK loop does not claim production settlement finality.

## Threat model and controls

| Asset / boundary                             | Abuse case                                                        | Control                                                                                                                          | Residual risk                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Provider 402 response → application callback | Oversized or malformed challenge exhausts memory or tricks policy | Clone the response, cap retained body bytes at 64 KiB, forward payment-related headers only, and preserve malformed JSON as text | The application still validates offer semantics before signing                                                |
| Callback → retry request                     | Credential changes routing or request identity                    | Reject hop-by-hop, cookie, host, content-length, proxy, and idempotency headers; keep the original URL/method/body               | The application chooses the trusted callback implementation                                                   |
| First request → retry                        | Duplicate payment or paid-but-undelivered result                  | At most one credential-backed retry; never invoke policy after a second 402                                                      | A provider can still settle and fail to deliver; persistent Receipt/Delivery reconciliation is follow-up work |
| Non-safe body                                | Replay causes duplicate side effects or a paid-but-unusable call  | Preflight default deny; require opt-in plus provider-supported `Idempotency-Key` before policy/wallet interaction                | The provider must actually enforce the idempotency key                                                        |
| Redirected 402                               | Credential is bound to one resource but retried on another        | Reject a changed effective URL before reading the challenge or invoking policy                                                   | Applications can implement an explicit provider-specific redirect flow                                        |

## Rollback

The new behavior is opt-in: existing callbacks that return `undefined` keep the original 402 response. Removing use of returned credentials returns clients to the previous manual path without changing wallet or settlement state.
