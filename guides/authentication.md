# Authentication

Goal: authenticate against XAgent so settlement calls carry a scoped JWT. Keys never reach the agent — xpense holds only the token.

## Steps

1. **Login** — `await xpense.login(authMode?)`. Modes: `"loopback"` (browser + local redirect), `"device"` (device code), `"paste"` (browser, paste code back — the default). CLI equivalent: `xpense login`.
2. **Store** — credentials are written to `~/.config/xagent/credentials.json` at mode `0600` (`%APPDATA%\xagent` on Windows).
3. **Use** — `xpense.gateway()` calls `ensureAccessToken()`, which refreshes the access token if expired, then builds the settlement client.
4. **Inspect / clear** — `xpense.whoami()` returns saved credentials; `xpense.logout()` clears them.

```ts
await xpense.login("loopback");
const me = await xpense.whoami(); // SavedCredentials | null
const gw = await xpense.gateway(); // token auto-refreshed
await xpense.logout();
```

Reference: [runLogin](../docs/access/login.md) · [Credentials & Tokens](../docs/access/credentials.md).
