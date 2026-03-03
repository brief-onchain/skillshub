# SkillsBrain Web

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

Backend aggregates all `../skills/lib-*/library.json` files dynamically.

## Install Skills (npx)

```bash
npx @skillsbrain/price-snapshot
npx @skillsbrain/top-movers-radar
npx @skillsbrain/kline-brief
npx @skillsbrain/funding-watch
npx @skillsbrain/open-interest-scan
npx @skillsbrain/symbol-status-checker
npx @skillsbrain/bsc-rpc-fanout-check
npx @skillsbrain/bap578-adapter-blueprint
npx @skillsbrain/bap578-vault-checklist
npx @skillsbrain/bap578-deploy-plan
npx @skillsbrain/bap578-test-template
npx @skillsbrain/bap578-contract-idea-sprint
```

Note: these package names are the SkillsBrain naming plan; publish to npm under the same names before public installation.

## Environment

```bash
cp .env.example .env.local
```

Key fields:

- `FLAP_ENV_FILE`: default `/Users/klxhans/Downloads/flap-nfa-mint/.env`
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

- `deploy/skillsbrain-web.service`
- `deploy/nginx.skillsbrain.conf`

Remote path convention:

- `/opt/skillsbrain/skillsbrain-web`

## Notes

- Local edits are not cloud deploys until pushed to Git and picked by GitOps.
- Sensitive env values from `flap-nfa-mint/.env` are loaded server-side only.
- Avoid exposing private keys in frontend code.
