---
name: committee_prediction_market
description: Adapted from gougoubi-ai/committee-prediction-market-skills. Guides Agents through GouGouBi committee-based prediction market flows on BSC, including proposal creation, committee staking, condition activation and settlement, dispute arbitration, governance rewards, and YES/NO CPMM trading.
---

# Committee Prediction Market

## Usage

- Category: Ecosystem
- Mode: guide
- Version: 0.1.0

## Input Example

```json
{
  "action": "create_proposal",
  "proposalName": "BTC closes above 120000 USDT on 2026-06-30",
  "deadline": 1782777600,
  "liquidityToken": "0x...",
  "proposalSkills": "Use Binance BTCUSDT daily close; settle in Beijing time; fetch final close before committee settlement vote.",
  "stakeAmountDoge": 10
}
```

## Upstream Source

- Adapted from: `gougoubi-ai/committee-prediction-market-skills`
- Upstream author: `frank`
- Upstream X: `@gougoubi_ai`
- Canonical skill spec: `https://github.com/gougoubi-ai/committee-prediction-market-skills/blob/main/SKILLS.md`
- Repository: `https://github.com/gougoubi-ai/committee-prediction-market-skills`

## Deployment Anchors

- Network: BSC mainnet (`chainId = 56`)
- Factory: `0xa334AcEFc50AE494610678FBf7e2A35Ca05Ff336`
- DOGE staking token: `0xb05678Ed0c9559955559DE864829a0c8AF574444`
- Proposal and Condition contracts are factory-created minimal clones

## Lifecycle

1. Create a proposal:
   approve DOGE to the Factory, then call `proposeMarketCreation(..., skills, ..., stakeAmount)`.
2. Join the proposal committee:
   call `stakeForProposalCommittee(proposal, amount)`, and query `getProposalCommitteeMinStakeToJoin(proposal)` first if the committee is already full.
3. Create a condition:
   a committee member calls `createConditions(..., _rules, _skills, _isNormalized)`.
4. Activate or reject the condition:
   committee members call `voteOnConditionActivation(condition, approve)` until the 2/3 threshold is reached.
5. Trade or provide liquidity:
   only when the condition status is `ACTIVE`, use `addLiquidity`, `buyYes`, `buyNo`, `sellYes`, `sellNo`, or swaps.
6. Vote on settlement:
   committee members lock at least 10 DOGE and call `conditionSettlementVoteLock` / `voteOnConditionResult`.
7. Initiate a dispute:
   within the dispute window, call `initiateDispute(condition, evidence, lockAmount)` with at least 10 DOGE.
8. Run supreme committee arbitration:
   supreme members stake at least 100 DOGE and top-21 members call `voteConditionDisputeSupreme`.
9. Finalize and claim:
   once `SETTLED`, users can `redeem` / `claimLp`, and governance members can `claimGovernanceReward`.

## `skills` Metadata Conventions

- `Proposal.skills` describes how the overall proposal should be queried and settled.
- `Condition.skills` describes how one specific condition should be queried or executed.
- Prefer putting timezone, data source, API URL, parsing hints, and settlement rules into these fields so downstream Agents can generate scripts or external calls directly.

## Key Constants

- `MIN_STAKE_AMOUNT`: 10 DOGE
- `COMMITTEE_MIN_SIZE`: 3
- `SETTLEMENT_BOND_MIN`: 10 DOGE
- `DISPUTE_BOND_MIN`: 10 DOGE
- `SUPREME_MIN_STAKE_AMOUNT`: 100 DOGE
- `GOVERNANCE_SIZE`: 21
- `SETTLEMENT_VOTE_WINDOW_SECONDS`: 600
- `DISPUTE_WINDOW_SECONDS`: 600
- `SETTLEMENT_PENALTY_WINDOW_SECONDS`: 600

## Guardrails

- Always read `Proposal.conditionStatus(conditionContract)` before choosing the next call.
- DOGE allowance to the Factory is a prerequisite for proposal creation, committee staking, and supreme staking.
- Committee-only actions: `createConditions`, activation votes, settlement votes.
- Supreme-only dispute arbitration: top 21 stakers returned by `getSupremeCommitteeMembers`.
- Trading is valid only after `ACTIVE`; `redeem` and `claimLp` are valid only after `SETTLED`.
- Keep human confirmation before any write call that stakes, votes, disputes, trades, or redeems.

## Common Contract Surface

- Factory:
  `proposeMarketCreation`, `stakeForProposalCommittee`, `stakeForSupremeCommittee`, `voteConditionDisputeSupreme`, `claimGovernanceReward`, `penalizeProposalCommitteeForNoVote`
- Proposal:
  `createConditions`, `voteOnConditionActivation`, `conditionSettlementVoteLock`, `voteOnConditionResult`, `initiateDispute`, `checkConditionStatus`
- Condition:
  `addLiquidity`, `buyYes`, `buyNo`, `sellYes`, `sellNo`, `swapYesForNo`, `swapNoForYes`, `redeem`, `claimLp`

## Notes

- This local skill packages the upstream call conventions into the SkillsHub format; it does not bundle the upstream contracts or ABIs.
- If you need full ABI fragments, event names, or state-machine details, use the upstream `SKILLS.md` as the canonical reference.

## Source Anchors

- Upstream skill spec: `https://github.com/gougoubi-ai/committee-prediction-market-skills/blob/main/SKILLS.md`
- Upstream repository: `https://github.com/gougoubi-ai/committee-prediction-market-skills`
- Upstream X profile: `https://x.com/gougoubi_ai`
