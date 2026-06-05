import { formatUnits, parseUnits } from "viem";

export const MONEY_SCALE = 18;

export function toBaseUnits(amount: string): bigint {
  try {
    return parseUnits(amount as `${number}`, MONEY_SCALE);
  } catch (cause) {
    throw new Error(
      `invalid amount "${amount}": ${cause instanceof Error ? cause.message : String(cause)}`
    );
  }
}

export function formatBaseUnits(value: bigint): string {
  return formatUnits(value, MONEY_SCALE);
}
