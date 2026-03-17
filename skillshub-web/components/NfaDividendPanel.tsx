'use client';

import { useEffect, useState } from 'react';
import { formatUnits } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { skillNfaDividendV2Abi } from '@/lib/nfa-dividend-contract';
import type { NfaPublicConfig } from '@/lib/nfa';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

type PendingRound = {
  roundId: number;
  amountWei: string;
  amountBnb: string;
  eligibleShares: string;
  claimed: boolean;
  createdAt: string;
  snapshotBlock: string;
  proof: `0x${string}`[];
};

type PendingSummary = {
  contractAddress: `0x${string}`;
  contractVersion: 'legacy' | 'v2';
  pendingWei: string;
  pendingBnb: string;
  claimableRounds: number;
  currentQualification: {
    walletAddress: `0x${string}`;
    nfaBalance: string;
    skillBalance: string;
    skillQualifiedShares: string;
    eligibleShares: string;
  };
  rounds: PendingRound[];
  claimPayload: {
    roundIds: number[];
    eligibleShares: string[];
    amounts: string[];
    proofs: `0x${string}`[][];
  };
  warnings: string[];
};

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function NfaDividendPanel({ config }: { config: NfaPublicConfig }) {
  const { address, isConnected } = useAccount();
  const dividendContractAddress = (config.dividendContractAddress || ZERO_ADDRESS) as `0x${string}`;
  const hasDividendContract = dividendContractAddress !== ZERO_ADDRESS;
  const [summary, setSummary] = useState<PendingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: writePending,
    reset: resetWrite
  } = useWriteContract();
  const receiptQuery = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash)
    }
  });

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      if (!hasDividendContract || !address) {
        setSummary(null);
        setLoadError('');
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`/api/nfa/dividend/pending?wallet=${address}`, {
          cache: 'no-store'
        });
        const payload = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to load dividend summary');
        }

        setSummary(payload as PendingSummary);
      } catch (error) {
        if (!cancelled) {
          setSummary(null);
          setLoadError(error instanceof Error ? error.message : 'Failed to load dividend summary');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [address, hasDividendContract, txHash]);

  useEffect(() => {
    if (!receiptQuery.isSuccess) {
      return;
    }

    resetWrite();
  }, [receiptQuery.isSuccess, resetWrite]);

  const unclaimedRounds = summary?.rounds.filter((round) => !round.claimed) || [];
  const handleClaim = () => {
    if (!summary || !hasDividendContract || !address || unclaimedRounds.length === 0) {
      return;
    }

    writeContract({
      abi: skillNfaDividendV2Abi,
      address: dividendContractAddress,
      functionName: 'claimMany',
      args: [
        summary.claimPayload.roundIds.map((value) => BigInt(value)),
        summary.claimPayload.eligibleShares.map((value) => BigInt(value)),
        summary.claimPayload.amounts.map((value) => BigInt(value)),
        summary.claimPayload.proofs
      ]
    });
  };

  const actionLabel = writePending
    ? 'Submitting Claim...'
    : receiptQuery.isLoading
      ? 'Waiting For Confirmation...'
      : unclaimedRounds.length > 1
        ? `Claim ${unclaimedRounds.length} Rounds`
        : 'Claim Dividend';

  const skillBalanceDisplay = summary
    ? formatUnits(BigInt(summary.currentQualification.skillBalance), config.paymentTokenDecimals || 18)
    : '0';
  const surfaceError = loadError || writeError?.message || receiptQuery.error?.message || '';

  return (
    <div className="rounded-[28px] border border-gold/20 bg-panel/70 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold/70">
            Holder Dividend
          </div>
          <h2 className="mt-3 text-2xl font-heading font-bold text-text-main">
            Snapshot claim lane
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-text-sub">
          100k SKILL / share
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Pending BNB
          </div>
          <div className="mt-2 text-2xl font-heading font-bold text-text-main">
            {hasDividendContract && isConnected && summary ? summary.pendingBnb : '0'}
          </div>
          <div className="mt-1 text-xs text-text-sub/70">
            Claimable rounds: {summary?.claimableRounds || 0}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Dividend Contract
          </div>
          <div className="mt-2 text-sm font-mono text-gold">
            {hasDividendContract
              ? summary?.contractVersion === 'legacy'
                ? `${shortAddress(dividendContractAddress)} · Legacy`
                : shortAddress(dividendContractAddress)
              : 'Not configured'}
          </div>
          <div className="mt-1 text-xs text-text-sub/70">
            Each round snapshots NFA + SKILL balances before funds become claimable.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Current NFA
          </div>
          <div className="mt-2 text-xl font-heading font-bold text-text-main">
            {summary?.currentQualification.nfaBalance || '0'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Current {config.paymentTokenSymbol}
          </div>
          <div className="mt-2 text-xl font-heading font-bold text-text-main">
            {summary ? skillBalanceDisplay : '0'}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Qualified Shares Now
          </div>
          <div className="mt-2 text-xl font-heading font-bold text-text-main">
            {summary?.currentQualification.eligibleShares || '0'}
          </div>
          <div className="mt-1 text-xs text-text-sub/70">
            `min(NFA, floor(SKILL / 100k))`
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm leading-7 text-text-sub">
        Dividend is no longer a single rolling balance formula. Each cron run creates a frozen
        snapshot round. If a wallet is short on {config.paymentTokenSymbol} when the round is
        created, the missing shares are gone for that round and cannot be recovered later.
      </div>

      {summary?.rounds.length ? (
        <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
            Latest Snapshot Rounds
          </div>
          <div className="mt-3 grid gap-3">
            {summary.rounds
              .slice()
              .sort((left, right) => right.roundId - left.roundId)
              .slice(0, 4)
              .map((round) => (
                <div
                  key={round.roundId}
                  className="rounded-2xl border border-white/8 bg-bg/70 p-4 text-sm text-text-sub"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="font-heading text-text-main">Round #{round.roundId}</div>
                    <div className="text-xs font-mono uppercase tracking-[0.18em] text-gold/70">
                      {round.claimed ? 'Claimed' : 'Claimable'}
                    </div>
                  </div>
                  <div className="mt-2">
                    {round.amountBnb} BNB · {round.eligibleShares} shares · block {round.snapshotBlock}
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleClaim}
          disabled={
            !hasDividendContract ||
            !isConnected ||
            !summary ||
            unclaimedRounds.length === 0 ||
            writePending ||
            receiptQuery.isLoading ||
            isLoading
          }
          className="rounded-2xl bg-gold px-5 py-3 text-sm font-heading font-bold text-bg transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>

        {isLoading ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text-sub">
            Loading dividend rounds...
          </div>
        ) : null}

        {summary?.warnings?.map((warning) => (
          <div
            key={warning}
            className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-100"
          >
            {warning}
          </div>
        ))}

        {surfaceError ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {surfaceError}
          </div>
        ) : null}

        {txHash ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Claim transaction:{' '}
            <a
              href={`${config.explorerBaseUrl}/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
              className="break-all text-emerald-200 underline-offset-4 hover:underline"
            >
              {txHash}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
