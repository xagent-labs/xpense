# Credentials & Tokens

Credential persistence and access-token refresh. Credentials are stored at `~/.config/xagent/credentials.json` (mode `0600`; `%APPDATA%\xagent` on Windows).

## ensureAccessToken

```ts
ensureAccessToken(apiBaseUrl: string): Promise<SavedCredentials>
```

Loads saved credentials and refreshes the access token if expired. Used by `Xpense.gateway()` before each settlement client is built.

## Credential store

```ts
loadCredentials(): Promise<SavedCredentials | null>
saveCredentials(creds: SavedCredentials): Promise<void>   // writes 0600
clearCredentials(): Promise<void>
```

## SavedCredentials

```ts
interface SavedCredentials {
  userId: string;
  accessToken: string;
  // refresh token + expiry fields
}
```

Outline only — exact fields live in `src/access/credentials.ts`.
