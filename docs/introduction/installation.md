# Installation

```sh
npm install @xagent/xpense
```

Requires Node `>=18.17`. ESM only (`type: module`).

## Configuration

xpense reads three environment variables, all overridable via `XpenseOptions`:

| Env                    | Default                   | Purpose                       |
| ---------------------- | ------------------------- | ----------------------------- |
| `XAGENT_API_BASE`      | `https://api.xerpaai.com` | xerpaai-go API base           |
| `XAGENT_FRONTEND_BASE` | `https://www.xerpaai.com` | OAuth login frontend          |
| `XAGENT_PI_MODE`       | `dry-run`                 | `live` \| `dry-run` \| `mock` |

See [`resolveConfig` / `XpenseConfig`](../facade/config.md).

## CLI

```sh
xpense login        # authenticate (loopback | device | paste)
```
