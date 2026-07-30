# X-Agent SDK

`@xagent/xpense` 是 X-Agent 的 TypeScript SDK：让开发者把 Agent 支出控制、HTTP 402 付费调用，以及未来的“按实际 AI 用量收费”接入自己的产品。

它的目标不是让开发者再造一套钱包、充值、积分和模型计费系统，而是提供统一的开发者入口：开发者专注产品功能，X-Agent 负责把一次可收费能力调用组织为可控制、可审计的执行。

> 本仓库只包含开源 SDK、类型、文档、示例和测试 mock。真实用户账户、充值、模型密钥、路由、持久化账本、钱包和结算服务属于闭源 X-Agent Commerce Gateway，绝不放入 SDK 或浏览器。

## 当前能力

| 能力                         | 当前状态  | 说明                                                                       |
| ---------------------------- | --------- | -------------------------------------------------------------------------- |
| Payment Intent 与预算治理    | 可用      | 精确金额、单笔/每日/总预算、审批、撤销与审计字段。                         |
| OKX / Onchain OS 接入        | 可用      | 钱包状态、登录、余额、`x402/sign`、`mpp/charge` 的类型化客户端。           |
| HTTP 402 paid-call loop      | 可用      | Challenge → 策略/钱包回调 → Credential → 单次安全重试。                    |
| X-Agent Commerce Runtime     | Reference | `reserve → invoke → settle → receipt` 合约和本地测试适配器；不是生产账本。 |
| 终端用户余额、充值、模型网关 | 计划中    | 由闭源 Commerce Gateway 实现。                                             |
| LangChain / OpenAI adapter   | 计划中    | 以 Runtime/Gateway Client 为基础提供薄适配层。                             |

## 安装

```bash
npm install @xagent/xpense
```

要求 Node.js `>=18.17`，ESM 项目。

## 快速开始：先把 Agent 支出放进治理层

默认是 `dry-run`，不会移动真实资金，适合先在产品中接入和测试。

```ts
import { Xpense } from "@xagent/xpense";

const xpense = new Xpense({
  mode: "dry-run",
  actor: "research-agent",
  budget: {
    perTxn: { amount: "1", currency: "USDC" },
    daily: { amount: "10", currency: "USDC" }
  }
});

const { intent, submit } = await xpense.emit({
  reason: { category: "api", description: "购买一次天气数据查询" },
  counterparty: { kind: "api", name: "weather.example" },
  amount: { kind: "fixed", value: { amount: "0.25", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});

console.log(intent.id, submit.status); // dry_run
```

金额始终是字符串，例如 `"0.25"`，SDK 内部使用 `bigint`，不要传 JavaScript 浮点数。

## 接入付费 API：安全处理 402

`createPayFetch` 只负责安全编排，不持有私钥，也不会自行决定支出。你的服务端回调必须先验证报价、创建/授权 Intent，再向闭源钱包/后端申请 credential。

```ts
import { createPayFetch } from "@xagent/xpense";

const payFetch = createPayFetch({
  onPaymentRequired: async (challenge, request) => {
    // 先校验 challenge.body，检查商户、金额、资产与资源地址。
    const signed = await gateway.x402Sign({
      accepts: (challenge.body as { accepts: unknown }).accepts,
      resource: request.url
    });

    return { headers: { [signed.headerName]: signed.authorizationHeader } };
  }
});

const response = await payFetch("https://provider.example/paid-resource");
```

规则：只自动重试一次；`GET`/`HEAD` 默认可重试；`POST` 等非安全方法必须同时提供调用方生成的 `Idempotency-Key`，并显式设置 `allowUnsafeReplay: true`。重定向后的 402、超大 Challenge、第二个 402 和危险 credential header 都会被拒绝或停止自动处理。

## X-Agent Runtime 的边界

`createXAgent()` 是 SDK 内的服务端 reference contract：

```text
requestId + user/project context
  → reserve max charge
  → invoke trusted model provider
  → settle exact usage
  → receipt + delivered result
```

它用于约束未来 LangChain、OpenAI SDK、MCP adapter 的一致行为。它**不是**面向浏览器的充值/钱包 SDK，也不是已经上线的 hosted model gateway。生产系统必须由闭源 Gateway 提供：鉴权、项目隔离、持久化 idempotency、provider 对账、余额、充值、模型路由、收据和恢复。

## 开发与验证

```bash
npm test
npm run lint
npm run build
npm run e2e
npm run docs:build
```

完整中文接入说明见 [SDK 开发指南](docs/zh-CN/sdk-guide.md)，实施顺序见 [开发计划](docs/zh-CN/development-plan.md)。

## 安全底线

- 不把项目 secret、provider key、钱包私钥或 access token 放进浏览器、Git、日志或 URL。
- 终端用户身份必须由闭源 Gateway 的短期 session 确定；服务端不信任客户端提交的 `userId`、余额或价格。
- 真实扣费必须遵循预留、结算、收据、对账与幂等约束；SDK 的内存状态不能替代生产账本。
- 402 回调必须校验商户、资源、资产和金额，不能对未知 Challenge 直接签名。

## 许可证

SDK 的开源许可证尚待项目方确认；在添加 OSI 许可证文件前，`package.json` 仍标记为 `UNLICENSED`。闭源 Commerce Gateway 不随 SDK 发布。
