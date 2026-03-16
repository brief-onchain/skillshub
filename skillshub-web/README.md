# SkillsHub Web

Next.js + GSAP frontend with built-in backend APIs for Binance/BSC skill playground.

## What Is Included

- Black-gold frontend (`app/`, `components/`)
- Backend APIs (`app/api/*`):
  - `GET /api/health`
  - `GET /api/skills`
  - `POST /api/playground`
- Local multi-library skill store (`skills/lib-*/library.json`)
- BAP578 helper skills based on local `flap-nfa-mint` patterns

## Skill Libraries (Local-first)

Skills are organized as:

- `../skills/lib-1-binance-market/library.json`
- `../skills/lib-2-bap578-dev/library.json`
- `../skills/lib-3-ecosystem-intake/library.json`
- `../skills/lib-*/skills/<skill-id>/SKILL.md`

Backend aggregates all `../skills/lib-*/library.json` files dynamically.

## Install Skills (npx)

```bash
npx @skillshub/price-snapshot
npx @skillshub/top-movers-radar
npx @skillshub/kline-brief
npx @skillshub/symbol-status
npx @skillshub/funding-watch
npx @skillshub/bap578-adapter-blueprint
```

Current launch build exposes 12 skills (market + BAP578 dev helpers + backlog placeholders).

## Environment

```bash
cp .env.example .env.local
```

Key fields:

- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: WalletConnect project id reused by the NFA page
- `NEXT_PUBLIC_BSC_RPC_URL` / `BSC_RPC_URL`: explicit BSC RPCs owned by this project
- `NEXT_PUBLIC_NFA_CONTRACT_ADDRESS`: deployed Genesis NFA address for live mint
- `NFA_OWNER`, `NFA_TREASURY`, `NFA_SALE_ACTIVE`, `NFA_BASE_URI`, `NFA_CONTRACT_URI`: deploy-script inputs for `DeploySkillGenesisNFA.s.sol`
- `NEXT_PUBLIC_NFA_PAYMENT_TOKEN_ADDRESS`: optional ERC20 token shown as the treasury mint route
- `NEXT_PUBLIC_NFA_PAYMENT_TOKEN_SYMBOL`: optional frontend fallback symbol for that token
- `NEXT_PUBLIC_NFA_PAYMENT_TOKEN_DECIMALS`: optional frontend fallback decimals for that token
- `NEXT_PUBLIC_NFA_DIVIDEND_CONTRACT_ADDRESS`: deployed dividend contract for pending/claim UI
- `NFA_DIVIDEND_REWARD_TOKEN`: deploy-script input for `DeploySkillNFADividend.s.sol` (`0x0` means native BNB reward)
- `CRON_SECRET`: shared secret for `/api/cron/dev-refill` and `/api/cron/distribute`
- `NFA_DIVIDEND_OPERATOR_PRIVATE_KEY`: signer used by cron routes
- `NFA_DIVIDEND_REFILL_AMOUNT_WEI` or `NFA_DIVIDEND_REFILL_AMOUNT`: optional default refill amount when cron runs without an explicit amount
- `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`: explicit chat config owned by this project
- `SKILLS_API_BASE`: optional remote API gateway for proxy mode
- `SKILLS_API_PATH`: default `/skills/run`
- `SKILLS_API_KEY`: optional

If `SKILLS_API_BASE` is empty, playground executes local skill handlers.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deploy (GitOps)

Deployment mode is **GitOps only**.

Local memory files:

- `deploy/DEPLOYMENT_MEMORY.md`
- `deploy/deployment-memory.json`

Infra templates kept in repo:

- `deploy/skillshub-web.service`
- `deploy/nginx.skillshub.conf`

Remote path convention:

- `/opt/skillshub/skillshub-web`

## Notes

- Local edits are not cloud deploys until pushed to Git and picked by GitOps.
- This app is self-contained for cloud deployment: it reads only this project's `.env.local` or platform-provided env vars.
- Avoid exposing private keys in frontend code.
- `app/nfa` assumes the Genesis NFA launch shape: 99 supply, 0.099 BNB native mint, optional ERC20 treasury route, single mint call with per-wallet cap.
- Claim is now available both through chat guidance and a separate wallet button on `/nfa`.
- Cron routes intentionally do not calculate "70% of daily tax" by themselves. Your external tax script should compute the amount, then call `/api/cron/dev-refill` with `amountWei` and `/api/cron/distribute` after refill.
