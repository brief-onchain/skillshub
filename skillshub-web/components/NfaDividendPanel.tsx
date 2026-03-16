'use client';

import { useEffect } from 'react';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import type { NfaPublicConfig } from '@/lib/nfa';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const ZERO_BIGINT = BigInt(0);
const dividendAbi = [
  {
    type: 'function',
    stateMutability: 'view',
    name: 'pendingDividend',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'claimDividend',
    inputs: [],
    outputs: [{ name: 'amount', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'rewardToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export default function NfaDividendPanel({ config }: { config: NfaPublicConfig }) {
  const { address, isConnected } = useAccount();
  const dividendContractAddress = (config.dividendContractAddress || ZERO_ADDRESS) as `0x${string}`;
  const hasDividendContract = dividendContractAddress !== ZERO_ADDRESS;

  const pendingQuery = useReadContract({
    abi: dividendAbi,
    address: dividendContractAddress,
    functionName: 'pendingDividend',
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: hasDividendContract && Boolean(address),
      refetchInterval: 10_000
    }
  });
  const rewardTokenQuery = useReadContract({
    abi: dividendAbi,
    address: dividendContractAddress,
    functionName: 'rewardToken',
    query: {
      enabled: hasDividendContract,
      refetchInterval: 60_000
    }
  });

  const rewardTokenAddress =
    typeof rewardTokenQuery.data === 'string' ? rewardTokenQuery.data : ZERO_ADDRESS;
  const isNativeReward = rewardTokenAddress === ZERO_ADDRESS;

  const tokenAddress = (rewardTokenAddress || ZERO_ADDRESS) as `0x${string}`;
  const tokenSymbolQuery = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'symbol',
    query: {
      enabled: hasDividendContract && !isNativeReward
    }
  });
  const tokenDecimalsQuery = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'decimals',
    query: {
      enabled: hasDividendContract && !isNativeReward
    }
  });

  const pendingAmount = typeof pendingQuery.data === 'bigint' ? pendingQuery.data : ZERO_BIGINT;
  const rewardSymbol =
    isNativeReward
      ? 'BNB'
      : typeof tokenSymbolQuery.data === 'string' && tokenSymbolQuery.data
        ? tokenSymbolQuery.data
        : 'TOKEN';
  const rewardDecimals =
    isNativeReward
      ? 18
      : typeof tokenDecimalsQuery.data === 'number'
        ? tokenDecimalsQuery.data
        : 18;
  const pendingDisplay = isNativeReward
    ? formatEther(pendingAmount)
    : formatUnits(pendingAmount, rewardDecimals);

  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: writePending
  } = useWriteContract();
  const receiptQuery = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash)
    }
  });

  useEffect(() => {
    if (!receiptQuery.isSuccess) {
      return;
    }

    pendingQuery.refetch();
  }, [pendingQuery, receiptQuery.isSuccess]);

  const handleClaim = () => {
    if (!hasDividendContract || !address) {
      return;
    }

    writeContract({
      abi: dividendAbi,
      address: dividendContractAddress,
      functionName: 'claimDividend'
    });
  };

  const actionLabel = writePending
    ? 'Submitting Claim...'
    : receiptQuery.isLoading
      ? 'Waiting For Confirmation...'
      : 'Claim Dividend';

  const surfaceError = writeError?.message || receiptQuery.error?.message || '';

  return (
    <div className="rounded-[28px] border border-gold/20 bg-panel/70 p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.3em] text-gold/70">
            Holder Dividend
          </div>
          <h2 className="mt-3 text-2xl font-heading font-bold text-text-main">
            Standalone claim lane
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-text-sub">
          Claim-based
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Pending
          </div>
          <div className="mt-2 text-2xl font-heading font-bold text-text-main">
            {hasDividendContract && isConnected ? pendingDisplay : '0'}
          </div>
          <div className="mt-1 text-xs text-text-sub/70">
            Asset: {rewardSymbol}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
            Dividend Contract
          </div>
          <div className="mt-2 text-sm font-mono text-gold">
            {hasDividendContract ? shortAddress(dividendContractAddress) : 'Not configured'}
          </div>
          <div className="mt-1 text-xs text-text-sub/70">
            Users claim manually. No auto-push payout.
          </div>
        </div>
      </div>

      <div className="mt-6 text-sm leading-7 text-text-sub">
        This panel is separate from chat because holders will expect a direct claim button. The
        copilot can still explain pending balance and claim flow, but the actual claim stays as a
        normal wallet transaction.
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleClaim}
          disabled={
            !hasDividendContract ||
            !isConnected ||
            pendingAmount <= ZERO_BIGINT ||
            writePending ||
            receiptQuery.isLoading
          }
          className="rounded-2xl bg-gold px-5 py-3 text-sm font-heading font-bold text-bg transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {actionLabel}
        </button>

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
