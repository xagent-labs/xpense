import type { PaymentIntentMode } from "./intent/types.ts";

export interface XpenseConfig {
  apiBaseUrl: string;
  frontendBase: string;
  mode: PaymentIntentMode;
  version: string;
}

function normalizeMode(value: string | undefined): PaymentIntentMode | undefined {
  if (value === "live" || value === "dry-run" || value === "mock") {
    return value;
  }
  return undefined;
}

export function resolveConfig(overrides: Partial<XpenseConfig> = {}): XpenseConfig {
  return {
    apiBaseUrl: overrides.apiBaseUrl ?? process.env.XAGENT_API_BASE ?? "https://api.xerpaai.com",
    frontendBase:
      overrides.frontendBase ?? process.env.XAGENT_FRONTEND_BASE ?? "https://www.xerpaai.com",
    mode: overrides.mode ?? normalizeMode(process.env.XAGENT_PI_MODE) ?? "dry-run",
    version: overrides.version ?? "0.1.0"
  };
}
