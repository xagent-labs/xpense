# Gas abstraction for 402 payments

When an agent hits an HTTP `402 Payment Required` and xpense settles on-chain, someone must pay X Layer gas. The agent must **not** hold native gas tokens — that breaks the "no keys, no ops for the model" guarantee. This note picks how gas gets paid.

## The constraint

- The agent signs intent, never a gas-bearing transaction.
- The user's funds are USDC (or another stablecoin), not native gas.
- Settlement runs through xerpaai-go; xpense only emits the signed authorization.

## Options

| Option                      | Mechanism                                                                      | Agent holds gas? | New contract?      | Best for                                      |
| --------------------------- | ------------------------------------------------------------------------------ | ---------------- | ------------------ | --------------------------------------------- |
| **A · EIP-3009 (x402 std)** | Agent signs `transferWithAuthorization`; a facilitator submits it and pays gas | No               | No — USDC native   | One-shot 402 charges (recommended start)      |
| **B · ERC-4337 paymaster**  | Smart account + paymaster sponsors gas, recouped in USDC                       | No               | Paymaster contract | MPP sessions, streamed vouchers, batched pays |
| **C · Meta-tx forwarder**   | Custom forwarder; a relayer pays gas and recoups                               | No               | Forwarder contract | Fallback if X Layer lacks A/B infra           |

## Recommended path

1. **Start with A.** x402 is already built on EIP-3009 — the agent signs an off-chain `transferWithAuthorization`, and a **facilitator** (run by xerpaai-go) submits it on X Layer and pays the gas. If X Layer USDC supports `transferWithAuthorization`, this is zero new on-chain code. This is exactly what `OnchainosGateway.x402Sign` already targets.
2. **Add B when sessions land.** For MPP-style streamed vouchers / spend permissions (`mpp/charge` session lifecycle), move to ERC-4337 with a paymaster so a smart account can sponsor gas and enforce spend limits on-chain.
3. **Fall back to C only if forced.** If X Layer USDC does not implement EIP-3009 and there is no 4337 bundler, ship a minimal meta-transaction forwarder contract (ZIHAO's call: "if X Layer doesn't support it, we build a contract"). This is the last resort, not the default.

## Who eats the gas

The facilitator fronts gas, then recoups it by charging `amount + gas markup` at settlement, or the platform subsidizes it so the agent sees a clean stablecoin debit. Either way the agent and the model stay gas-unaware.

## To verify on X Layer (open)

- [ ] Does X Layer USDC implement EIP-3009 `transferWithAuthorization`?
- [ ] Is there an ERC-4337 bundler + paymaster available on X Layer?
- [ ] Does the xerpaai-go facilitator already sponsor gas, or is that a backend gap to file?

Until verified, xpense stays correct regardless: it only emits the signed intent — the gas-payment mechanism is entirely a settlement-side (xerpaai-go / X Layer) concern.
