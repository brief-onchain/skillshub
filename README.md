# SkillsHub: Install Skills Fast

这个仓库面向“安装和使用 Skills”。

## 0. 3 条最短安装命令

```bash
npx @skillshub/price-snapshot
npx @skillshub/top-movers-radar
npx @skillshub/ai-quick-chat
npx @skillshub/cz-style-rewrite
npx @skillshub/bap578-adapter-blueprint
```

## 1. 前置要求

- Node.js `>= 18`
- npm

## 2. 一键安装单个 Skill（npx）

示例：

```bash
npx @skillshub/price-snapshot
```

## 3. 可安装 Skills 列表

### Binance Market (Live + Guide)

```bash
npx @skillshub/price-snapshot
npx @skillshub/top-movers-radar
npx @skillshub/ai-quick-chat
npx @skillshub/cz-style-rewrite
npx @skillshub/kline-brief
npx @skillshub/symbol-status
npx @skillshub/funding-watch
npx @skillshub/open-interest-scan
npx @skillshub/bsc-rpc-fanout-check
```

### BAP578 Dev (Guide)

```bash
npx @skillshub/bap578-adapter-blueprint
npx @skillshub/bap578-vault-checklist
npx @skillshub/bap578-deploy-plan
npx @skillshub/bap578-test-template
npx @skillshub/bap578-contract-idea-sprint
```

## 4. 如何挑选 Skill

- 想要行情/市场数据：优先用 `price-snapshot`、`top-movers-radar`、`kline-brief`
- 想要交易状态/风控信息：用 `symbol-status`、`funding-watch`
- 想要 BAP578 合约开发辅助：用 `bap578-*`

## 5. 失败排查

如果安装失败，按顺序检查：

1. `node -v` 是否 >= 18
2. `npm config get registry` 是否可用
3. 切换镜像后重试（如公司网络/代理）

## 6. 本地文档索引（可选）

每个 Skill 的本地说明在：

- `skills/lib-*/skills/<skill-id>/SKILL.md`

技能元信息来源：

- `skills/lib-*/library.json`
