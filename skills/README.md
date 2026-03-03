# SkillsHub Skill Libraries

This directory stores all SkillsHub libraries in local-first format.

## Layout

- `lib-1-binance-market/`
- `lib-2-bap578-dev/`
- `lib-3-ecosystem-intake/`

Each library contains:

- `library.json` (index used by web/API)
- `skills/<skill-id>/SKILL.md` (skill package style documentation)

## Install Naming Plan

Each skill uses this npm naming convention:

- `@skillshub/<skill-id>`

Examples:

- `npx @skillshub/price-snapshot`
- `npx @skillshub/funding-watch`
- `npx @skillshub/bap578-adapter-blueprint`
