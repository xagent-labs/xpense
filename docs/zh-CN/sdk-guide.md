# X-Agent SDK 开发指南

## 给谁用

面向正在用 vibe coding、LangChain、OpenAI SDK 或自建 Agent Runtime 做 AI 产品的开发者。SDK 解决“Agent 和付费能力如何被控制与审计”；闭源 Gateway 解决“终端用户如何充值、如何按模型用量扣费”。

## 推荐接入顺序

1. 先以 `dry-run` 接入 `Xpense`，验证 Intent 和预算规则。
2. 为外部付费 API 接入 `createPayFetch`，只在服务端调用钱包/后端。
3. 后端 Gateway 上线后，使用短期 end-user session 调用模型网关；不要在客户端实现 reserve/settle。
4. 最后接入 LangChain / MCP adapter，并为每个 Agent task 设置预算上限。

## 1. Payment Intent 与预算

每次会移动资金或购买外部能力时，先产生 Payment Intent。Intent 是审计和策略对象，不是私钥，也不是链上交易。

```ts
const xpense = new Xpense({
  mode: "dry-run",
  budget: { perTxn: { amount: "2", currency: "USDC" } }
});

await xpense.emit({
  reason: { category: "data", description: "购买数据集访问" },
  counterparty: { kind: "merchant", name: "Acme Data" },
  amount: { kind: "fixed", value: { amount: "1.20", currency: "USDC" } },
  approval: { mode: "policy" },
  policy: { allowedCurrencies: ["USDC"] }
});
```

预算拒绝、需要人工审批和撤销不是异常分支，而是正常产品状态。UI 应明确展示拒绝原因、额度和下一步动作。

## 2. 402 的正确使用方式

402 请求的完整路径是：

```text
请求资源 → 收到 402 → 验证报价 → 策略/预算授权 → 后端签名 → 带 credential 重试一次 → 获得资源或收据
```

必须做到：

- 只信任 allowlist 商户和已验证 resource；
- `POST` 必须有业务幂等键，并只在服务商支持幂等时开启自动重试；
- 失败、超时或交付未知时保留可对账引用，不能直接再次扣费；
- 钱包签名仅在服务端/可信执行环境进行。

## 3. Runtime 与闭源 Gateway

开源 SDK 的 `createXAgent()` 暴露 `BillingPort` 和 `ModelProvider`，目的是定义安全状态机并支持 SDK 测试。它们是**可信服务端 port**：不能由浏览器、前端函数或普通应用代码直接实现真实资金逻辑。

生产 Gateway 必须保证：

| 不变量     | 后端实现要求                                                                    |
| ---------- | ------------------------------------------------------------------------------- |
| 租户隔离   | 用 session claims 推导 tenant/project/user；数据库唯一键包含这些维度。          |
| 余额正确   | append-only ledger；reserve、settle、release 在事务中完成。                     |
| 不重复调用 | 同一业务 idempotency key + request hash 只对应一个 execution/provider attempt。 |
| 未知结果   | 保存 provider attempt ID、deadline、receipt/delivery；通过对账恢复。            |
| 真实定价   | 后端按项目价格表、模型和最大输出估算/授权，不信任客户端价格。                   |

## 4. 生产安全清单

- Project secret 只存在于开发者自己的后端；
- end-user session 短期、可撤销、限定 audience/project；
- Provider API key 和钱包私钥只在 Gateway；
- 所有 model、余额、receipt 查询做对象级授权；
- webhook 验签、时间窗、replay protection 与幂等；
- 日志用 request ID / receipt ID 关联，脱敏 prompt、token 和凭证；
- 给 provider 调用设置 timeout、AbortSignal、并发上限和 provider-specific idempotency key。

## 5. 当前限制

当前公开仓库不提供真实充值、用户账户、模型路由、持久化账本或 Gateway HTTP client。这些是闭源服务开发项。不要把 `InMemoryBilling` 当作生产钱包或跨实例账本。

## 参考

- [Payment Intent 指南](../../guides/emit-first-payment-intent.md)
- [402 指南](../settlement/pay-fetch.md)
- [Commerce Runtime 设计](../runtime/commerce-runtime.md)
- [开发计划](development-plan.md)
