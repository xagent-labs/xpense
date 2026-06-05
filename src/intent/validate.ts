import type { PaymentIntent } from "./types.ts";

export function isDecimalString(value: unknown): boolean {
  return typeof value === "string" && /^\d+(\.\d+)?$/.test(value);
}

export function validatePaymentIntent(pi: PaymentIntent): string[] {
  const errors: string[] = [];
  if (pi.schemaVersion !== "1") {
    errors.push("schemaVersion must be '1'");
  }
  if (!pi.reason || !pi.reason.description) {
    errors.push("reason.description is required");
  }
  if (!pi.counterparty || !pi.counterparty.name) {
    errors.push("counterparty.name is required");
  }
  const money = pi.amount?.value;
  if (!money) {
    errors.push("amount.value is required");
  } else {
    if (!isDecimalString(money.amount)) {
      errors.push(
        `amount must be a decimal string (no float), got ${JSON.stringify(money.amount)}`
      );
    }
    if (!money.currency) {
      errors.push("amount.currency is required");
    }
  }
  if (
    money &&
    pi.policy?.allowedCurrencies &&
    !pi.policy.allowedCurrencies.includes(money.currency)
  ) {
    errors.push(`currency ${money.currency} is not in allowedCurrencies`);
  }
  if (!pi.audit || !pi.audit.createdBy) {
    errors.push("audit.createdBy is required");
  }
  return errors;
}
