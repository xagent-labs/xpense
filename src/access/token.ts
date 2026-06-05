import { loadCredentials, saveCredentials, type SavedCredentials } from "./credentials.ts";
import { refreshAccessToken } from "./exchange.ts";

export async function ensureAccessToken(baseUrl: string): Promise<SavedCredentials> {
  const creds = await loadCredentials();
  if (!creds) {
    throw new Error("not logged in — run `xpense login` first");
  }
  const now = Math.floor(Date.now() / 1000);
  if (creds.accessExpire - now > 60) {
    return creds;
  }
  const refreshed = await refreshAccessToken({ baseUrl, refreshToken: creds.refreshToken });
  await saveCredentials(refreshed);
  return refreshed;
}
