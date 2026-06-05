# resolveConfig / XpenseConfig

Resolves the effective config from env vars overlaid with explicit options.

## resolveConfig

```ts
resolveConfig(options?: Partial<XpenseConfig>): XpenseConfig
```

| Param     | Type                    | Description                      |
| --------- | ----------------------- | -------------------------------- |
| `options` | `Partial<XpenseConfig>` | explicit overrides; win over env |

Resolution order: explicit option → env var → default.

| Field          | Env                    | Default                   |
| -------------- | ---------------------- | ------------------------- |
| `apiBaseUrl`   | `XAGENT_API_BASE`      | `https://api.xerpaai.com` |
| `frontendBase` | `XAGENT_FRONTEND_BASE` | `https://www.xerpaai.com` |
| `mode`         | `XAGENT_PI_MODE`       | `dry-run`                 |
| `version`      | —                      | package version           |

## Example

```ts
import { resolveConfig } from "@xagent/xpense";

const config = resolveConfig({ mode: "mock" });
```
