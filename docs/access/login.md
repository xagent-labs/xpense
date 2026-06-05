# runLogin

Runs an OAuth login flow against XAgent and returns saved credentials. `Xpense.login()` delegates here. CLI: `xpense login`.

```ts
runLogin(input: {
  authMode: AuthMode;
  baseUrl: string;
  frontendBase: string;
  version: string;
}): Promise<SavedCredentials>
```

## AuthMode

```ts
type AuthMode = "paste" | "loopback" | "device";
```

| Mode       | Flow                                                          |
| ---------- | ------------------------------------------------------------- |
| `loopback` | opens browser, captures the code on a local loopback redirect |
| `device`   | device-code flow (no local redirect)                          |
| `paste`    | opens browser; you paste the code back (the default)          |

## Example

```ts
import { runLogin } from "@xagent/xpense";

const creds = await runLogin({
  authMode: "loopback",
  baseUrl: "https://api.xerpaai.com",
  frontendBase: "https://www.xerpaai.com",
  version: "0.1.0"
});
```
