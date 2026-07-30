# X-Agent 开发计划

## 产品目标

让开发者只写 AI 产品功能：模型路由、终端用户账户、充值、余额、按用量扣费、日志和 Agent 购买外部能力由 X-Agent 提供。公开仓库只发布 SDK；真实商业与资金系统在私有 Gateway。

## P0：先跑通可信的“用户调用模型并收费”闭环

### 开源 SDK

- 完成中文 README、接入指南、Runtime contract 和测试；
- 发布 session-scoped `createXAgentClient()`，只调用 Gateway 的公开 API；
- 提供 OpenAI-compatible 与 LangChain 薄 adapter；
- 继续维护 Payment Intent、预算、402 safety loop 与 mock。

### 闭源 Commerce Gateway

- 开发者/组织/项目、project secret 和短期 end-user session；
- 统一模型网关：模型选择、价格表、最大输出估算、provider fallback；
- 用户 credits 账本：credit、reserve、settle、release、refund、adjustment；
- 充值 checkout 与 webhook 幂等；
- execution、provider attempt、usage、receipt、delivery 持久化；
- model invocation、余额、流水、收据、用量查询 API；
- rate limit、审计日志、告警、kill switch 和 reconciliation worker。

### P0 验收

一次模型调用必须只能得到两种业务结果：

1. 有内容，同时有已结算 receipt；或
2. 无内容，返回可查询的 execution/reservation 状态，等待对账。

不能出现“内容已返回但没有账本记录”、重复扣费、跨项目扣费，或客户端篡改用户/价格后生效。

## P1：让开发者像使用 LangChain 一样接入

- `xagent.chat()`、`xagent.agent()`、`xagent.user()`、`xagent.usage()`；
- LangChain Runnable/ChatModel adapter 与 OpenAI-compatible endpoint；
- streaming 的终态 usage/receipt event、断线重连与 delivery recovery；
- MCP / OpenAPI Capability Registry，描述价格、数据政策、SLA 和支付方式；
- Agent task budget、按 user/task/model/capability 的成本与收入视图。

## P2：Agent 能力市场与外部付费

- x402、MPP、OKX APP/Broker 等协议 adapter；
- Agentic Wallet delegated allowance 与审批策略；
- 外部能力的 offer、credential、receipt、delivery、dispute 状态机；
- provider routing：价格、延迟、成功率、隐私、质量和信誉；
- 商户接入、结算、质量评分和双向账本。

## 开发原则

- 先支付正确性，再扩充目录；
- 先 credits/账本，再暴露链上钱包；
- 所有真实状态由私有 Gateway 持久化；SDK 不持有密钥；
- 每个 P0 流程必须有幂等、超时、Unknown 对账和负向测试；
- 对外文档只描述已实现能力，计划能力必须标注为计划。
