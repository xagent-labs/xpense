import { loginWithDeviceCode } from "./device.ts";
import { loginWithLoopback } from "./loopback.ts";
import { loginWithPasteCode } from "./paste.ts";
import type { SavedCredentials } from "./credentials.ts";

export type AuthMode = "paste" | "loopback" | "device";

export async function runLogin(input: {
  authMode: AuthMode;
  baseUrl: string;
  frontendBase: string;
  version: string;
}): Promise<SavedCredentials> {
  if (input.authMode === "device") {
    return loginWithDeviceCode({
      baseUrl: input.baseUrl,
      frontendBase: input.frontendBase,
      clientVersion: input.version
    });
  }
  if (input.authMode === "loopback") {
    return loginWithLoopback({
      baseUrl: input.baseUrl,
      frontendBase: input.frontendBase,
      clientVersion: input.version,
      openBrowser: true
    });
  }
  return loginWithPasteCode({
    baseUrl: input.baseUrl,
    frontendBase: input.frontendBase,
    clientVersion: input.version,
    openBrowser: true
  });
}
