'use client';

import { useEffect, useState } from 'react';
import { erc20Abi, formatEther, formatUnits } from 'viem';
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi';
import type { NfaPublicConfig } from '@/lib/nfa';
import { skillGenesisNfaAbi } from '@/lib/nfa-contract';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const ZERO_BIGINT = BigInt(0);

type PaymentMode = 'bnb' | 'combo';
type TxKind = 'approve' | 'mint-bnb' | 'mint-combo' | null;

function shortAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatBnb(value: bigint) {
  const raw = Number(formatEther(value));
  return Number.isFinite(raw) ? raw.toFixed(raw >= 1 ? 2 : 4) : '0';
}

function formatTokenAmount(value: bigint, decimals: number) {
  const raw = Number(formatUnits(value, decimals));
  return Number.isFinite(raw) ? raw.toFixed(raw >= 1 ? 2 : 4) : '0';
}

function connectorLabel(name: string) {
  if (name === 'walletConnect') {
    return 'WalletConnect';
  }
  return name;
}

export default function NfaWalletPanel({ config }: { config: NfaPublicConfig }) {
  const [localError, setLocalError] = useState('');
  const [metadataUri, setMetadataUri] = useState('');
  const [txKind, setTxKind] = useState<TxKind>(null);

  const { address, chainId, isConnected, connector } = useAccount();
  const { connectors, connect, isPending: connectPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switchPending, error: switchError } = useSwitchChain();
  const {
    writeContract,
    data: txHash,
    error: writeError,
    isPending: writePending,
    reset: resetWrite
  } = useWriteContract();
  const nativeBalanceQuery = useBalance({
    address,
    chainId: config.chainId,
    query: {
      enabled: Boolean(address),
      refetchInterval: 10_000
    }
  });
  const metadataPlaceholder = config.baseUri
    ? `${config.baseUri}<tokenId>.json`
    : 'ipfs://.../11.json';

  const hasContract = Boolean(config.contractAddress);
  const contractAddress = (config.contractAddress || ZERO_ADDRESS) as `0x${string}`;
  const onBsc = chainId === config.chainId;

  const supplyQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'totalSupply',
    query: {
      enabled: hasContract,
      refetchInterval: 10_000
    }
  });
  const maxSupplyQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'maxSupply',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const reservedSupplyQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'reservedSupply',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const publicSupplyQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'publicSupply',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const reservedMintedQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'reservedMintedCount',
    query: {
      enabled: hasContract,
      refetchInterval: 10_000
    }
  });
  const publicMintedQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'publicMintedCount',
    query: {
      enabled: hasContract,
      refetchInterval: 10_000
    }
  });
  const priceQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'mintFee',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const treasuryQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'paymentTreasury',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const comboConfigQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'comboMintConfig',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const maxPerWalletQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'maxPerWallet',
    query: {
      enabled: hasContract,
      refetchInterval: 30_000
    }
  });
  const saleActiveQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'saleActive',
    query: {
      enabled: hasContract,
      refetchInterval: 10_000
    }
  });
  const holderBalanceQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'balanceOf',
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: hasContract && Boolean(address),
      refetchInterval: 10_000
    }
  });
  const walletMintCountQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'walletMintCount',
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: hasContract && Boolean(address),
      refetchInterval: 10_000
    }
  });

  const comboConfigData = comboConfigQuery.data;
  const comboEnabled = Array.isArray(comboConfigData) ? Boolean(comboConfigData[0]) : false;
  const comboTokenAddress =
    Array.isArray(comboConfigData) &&
    typeof comboConfigData[1] === 'string' &&
    comboConfigData[1] !== ZERO_ADDRESS
      ? comboConfigData[1]
      : config.paymentTokenAddress || '';
  const comboRouterAddress =
    Array.isArray(comboConfigData) &&
    typeof comboConfigData[2] === 'string' &&
    comboConfigData[2] !== ZERO_ADDRESS
      ? comboConfigData[2]
      : '';
  const comboNativePrice =
    Array.isArray(comboConfigData) && typeof comboConfigData[3] === 'bigint'
      ? comboConfigData[3]
      : BigInt(config.comboPriceWei);
  const comboQuoteNativeAmount =
    Array.isArray(comboConfigData) && typeof comboConfigData[4] === 'bigint'
      ? comboConfigData[4]
      : BigInt(config.priceWei);
  const hasComboToken = Boolean(comboTokenAddress);
  const comboTokenAddressRef = (comboTokenAddress || ZERO_ADDRESS) as `0x${string}`;
  const comboQuoteQuery = useReadContract({
    abi: skillGenesisNfaAbi,
    address: contractAddress,
    functionName: 'quoteSkillerForMint',
    query: {
      enabled: hasContract && comboEnabled && hasComboToken,
      refetchInterval: 10_000
    }
  });

  const tokenSymbolQuery = useReadContract({
    abi: erc20Abi,
    address: comboTokenAddressRef,
    functionName: 'symbol',
    query: {
      enabled: hasComboToken,
      refetchInterval: 60_000
    }
  });
  const tokenDecimalsQuery = useReadContract({
    abi: erc20Abi,
    address: comboTokenAddressRef,
    functionName: 'decimals',
    query: {
      enabled: hasComboToken,
      refetchInterval: 60_000
    }
  });
  const tokenBalanceQuery = useReadContract({
    abi: erc20Abi,
    address: comboTokenAddressRef,
    functionName: 'balanceOf',
    args: [address || ZERO_ADDRESS],
    query: {
      enabled: hasComboToken && Boolean(address),
      refetchInterval: 10_000
    }
  });
  const allowanceQuery = useReadContract({
    abi: erc20Abi,
    address: comboTokenAddressRef,
    functionName: 'allowance',
    args: [address || ZERO_ADDRESS, contractAddress],
    query: {
      enabled: hasComboToken && hasContract && Boolean(address),
      refetchInterval: 10_000
    }
  });

  const receiptQuery = useWaitForTransactionReceipt({
    hash: txHash,
    query: {
      enabled: Boolean(txHash)
    }
  });

  const totalSupply = typeof supplyQuery.data === 'bigint' ? Number(supplyQuery.data) : 0;
  const maxSupply =
    typeof maxSupplyQuery.data === 'bigint' ? Number(maxSupplyQuery.data) : config.maxSupply;
  const reservedSupply =
    typeof reservedSupplyQuery.data === 'bigint'
      ? Number(reservedSupplyQuery.data)
      : config.reservedSupply;
  const publicSupply =
    typeof publicSupplyQuery.data === 'bigint' ? Number(publicSupplyQuery.data) : config.publicSupply;
  const reservedMinted =
    typeof reservedMintedQuery.data === 'bigint' ? Number(reservedMintedQuery.data) : 0;
  const publicMinted =
    typeof publicMintedQuery.data === 'bigint' ? Number(publicMintedQuery.data) : 0;
  const publicRemaining = Math.max(0, publicSupply - publicMinted);
  const totalRemaining = Math.max(0, maxSupply - totalSupply);
  const priceWei = typeof priceQuery.data === 'bigint' ? priceQuery.data : BigInt(config.priceWei);
  const maxPerWallet =
    typeof maxPerWalletQuery.data === 'bigint' ? Number(maxPerWalletQuery.data) : config.maxPerWallet;
  const holderBalance = typeof holderBalanceQuery.data === 'bigint' ? Number(holderBalanceQuery.data) : 0;
  const walletMintCount =
    typeof walletMintCountQuery.data === 'bigint' ? Number(walletMintCountQuery.data) : 0;
  const saleActive = saleActiveQuery.data === undefined ? config.mintLive : Boolean(saleActiveQuery.data);
  const treasuryAddress =
    typeof treasuryQuery.data === 'string' && treasuryQuery.data ? treasuryQuery.data : '';
  const tokenSymbol =
    typeof tokenSymbolQuery.data === 'string' && tokenSymbolQuery.data
      ? tokenSymbolQuery.data
      : config.paymentTokenSymbol;
  const tokenDecimals =
    typeof tokenDecimalsQuery.data === 'number'
      ? tokenDecimalsQuery.data
      : config.paymentTokenDecimals;
  const tokenBalance =
    typeof tokenBalanceQuery.data === 'bigint' ? tokenBalanceQuery.data : ZERO_BIGINT;
  const allowance = typeof allowanceQuery.data === 'bigint' ? allowanceQuery.data : ZERO_BIGINT;
  const comboTokenQuote =
    typeof comboQuoteQuery.data === 'bigint' ? comboQuoteQuery.data : ZERO_BIGINT;
  const comboApproved = comboTokenQuote > ZERO_BIGINT && allowance >= comboTokenQuote;
  const nativeBalance = nativeBalanceQuery.data?.value ?? ZERO_BIGINT;
  const nativeBalanceSymbol = nativeBalanceQuery.data?.symbol || 'BNB';
  const hasEnoughBnbForPureMint = nativeBalance >= priceWei;
  const hasEnoughBnbForComboMint = nativeBalance >= comboNativePrice;
  const hasEnoughSkillForComboMint = comboTokenQuote > ZERO_BIGINT && tokenBalance >= comboTokenQuote;
  const comboRouteReady =
    comboEnabled && Boolean(comboRouterAddress) && hasComboToken && comboTokenQuote > ZERO_BIGINT;
  const commonMintBlocked =
    !hasContract || !saleActive || publicRemaining <= 0 || walletMintCount >= maxPerWallet;
  const pureMintDisabled =
    writePending || receiptQuery.isLoading || commonMintBlocked || !hasEnoughBnbForPureMint;
  const comboMintDisabled =
    writePending ||
    receiptQuery.isLoading ||
    commonMintBlocked ||
    !comboRouteReady ||
    !hasEnoughBnbForComboMint ||
    !hasEnoughSkillForComboMint;

  useEffect(() => {
    if (!receiptQuery.isSuccess) {
      return;
    }

    setLocalError('');
    allowanceQuery.refetch();
    nativeBalanceQuery.refetch();
    tokenBalanceQuery.refetch();

    if (txKind === 'mint-bnb' || txKind === 'mint-combo') {
      supplyQuery.refetch();
      reservedMintedQuery.refetch();
      publicMintedQuery.refetch();
      holderBalanceQuery.refetch();
      walletMintCountQuery.refetch();
    }

    setTxKind(null);
    resetWrite();
  }, [
    allowanceQuery,
    holderBalanceQuery,
    nativeBalanceQuery,
    publicMintedQuery,
    receiptQuery.isSuccess,
    reservedMintedQuery,
    resetWrite,
    supplyQuery,
    tokenBalanceQuery,
    txKind,
    walletMintCountQuery
  ]);

  const handleMint = (mode: PaymentMode) => {
    setLocalError('');

    if (!hasContract) {
      setLocalError('Contract address is not configured yet. Deploy the Genesis NFA contract first.');
      return;
    }
    if (!isConnected || !address) {
      setLocalError('Connect a wallet before minting.');
      return;
    }
    if (!onBsc) {
      setLocalError('Switch to BSC Mainnet before minting.');
      return;
    }
    if (!saleActive) {
      setLocalError('Mint is not open yet on the deployed contract.');
      return;
    }
    if (publicRemaining <= 0) {
      setLocalError('Public Genesis supply is sold out. The reserved 10 are not public mint slots.');
      return;
    }
    if (walletMintCount >= maxPerWallet) {
      setLocalError('Wallet mint limit reached.');
      return;
    }

    if (mode === 'combo') {
      if (!comboEnabled || !hasComboToken || comboTokenQuote <= ZERO_BIGINT) {
        setLocalError('BNB + Skiller mint is not enabled on the deployed contract yet.');
        return;
      }
      if (nativeBalance < comboNativePrice) {
        setLocalError(
          `Insufficient ${nativeBalanceSymbol} balance for combo mint. Keep at least ${formatBnb(comboNativePrice)} ${nativeBalanceSymbol} plus gas.`
        );
        return;
      }
      if (tokenBalance < comboTokenQuote) {
        setLocalError(`Insufficient ${tokenSymbol} balance for combo mint.`);
        return;
      }

      if (!comboApproved) {
        setTxKind('approve');
        writeContract({
          abi: erc20Abi,
          address: comboTokenAddressRef,
          functionName: 'approve',
          args: [contractAddress, comboTokenQuote]
        });
        return;
      }

      setTxKind('mint-combo');
      writeContract({
        abi: skillGenesisNfaAbi,
        address: contractAddress,
        functionName: 'mintNFAWithSkiller',
        args: [metadataUri.trim()],
        value: comboNativePrice
      });
      return;
    }

    if (nativeBalance < priceWei) {
      setLocalError(
        `Insufficient ${nativeBalanceSymbol} balance for pure BNB mint. Keep at least ${formatBnb(priceWei)} ${nativeBalanceSymbol} plus gas.`
      );
      return;
    }

    setTxKind('mint-bnb');
    writeContract({
      abi: skillGenesisNfaAbi,
      address: contractAddress,
      functionName: 'mintNFA',
      args: [metadataUri.trim()],
      value: priceWei
    });
  };

  function getMintButtonLabel(mode: PaymentMode) {
    if (writePending) {
      if (mode === 'combo' && txKind === 'approve') {
        return `Submitting ${tokenSymbol} Approval...`;
      }
      if ((mode === 'bnb' && txKind === 'mint-bnb') || (mode === 'combo' && txKind === 'mint-combo')) {
        return 'Submitting Mint...';
      }
      return 'Transaction In Progress...';
    }

    if (receiptQuery.isLoading) {
      if (mode === 'combo' && txKind === 'approve') {
        return 'Waiting For Approval...';
      }
      if ((mode === 'bnb' && txKind === 'mint-bnb') || (mode === 'combo' && txKind === 'mint-combo')) {
        return 'Waiting For Confirmation...';
      }
      return 'Waiting For Confirmation...';
    }

    if (!hasContract) {
      return 'Await Contract Address';
    }
    if (!saleActive) {
      return 'Mint Closed';
    }
    if (publicRemaining <= 0) {
      return 'Public Supply Sold Out';
    }
    if (walletMintCount >= maxPerWallet) {
      return 'Wallet Limit Reached';
    }

    if (mode === 'combo') {
      if (!comboRouteReady) {
        return 'Combo Mint Disabled';
      }
      if (!hasEnoughBnbForComboMint) {
        return 'Insufficient BNB';
      }
      if (!hasEnoughSkillForComboMint) {
        return `Insufficient ${tokenSymbol}`;
      }
      if (!comboApproved) {
        return `Approve ${tokenSymbol}`;
      }
      return `Mint With BNB + ${tokenSymbol}`;
    }

    if (!hasEnoughBnbForPureMint) {
      return 'Insufficient BNB';
    }

    return 'Mint With Pure BNB';
  }

  const surfaceError =
    localError ||
    writeError?.message ||
    connectError?.message ||
    switchError?.message ||
    receiptQuery.error?.message ||
    '';

  return (
    <div className="rounded-[28px] border border-gold/20 bg-panel/90 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.35em] text-gold/70">
            Genesis Mint
          </div>
          <h2 className="mt-3 text-2xl font-heading font-bold text-text-main">
            skillhub-nfa-genesis
          </h2>
        </div>
        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.25em] text-emerald-300">
          {hasContract && saleActive ? 'Mint Live' : 'Deploy First'}
        </span>
      </div>

      <div className="mt-6 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Wallet
            </div>
            <div className="mt-2 text-sm text-text-main">
              {isConnected && address ? shortAddress(address) : 'Not connected'}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              {connector?.name ? connectorLabel(connector.name) : 'Injected / WalletConnect'}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Network
            </div>
            <div className="mt-2 text-sm text-text-main">
              {isConnected ? (onBsc ? 'BSC Mainnet Ready' : `Chain ${chainId || 'unknown'}`) : 'Connect first'}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">Target chain: BSC mainnet</div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Total Minted
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-text-main">
              {hasContract ? `${totalSupply} / ${maxSupply}` : `${config.maxSupply} planned`}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              10 reserved IDs + 89 public IDs
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Public Supply
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-text-main">
              {hasContract ? `${publicMinted} / ${publicSupply}` : `${config.publicSupply} planned`}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              Remaining public mints: {publicRemaining}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Reserved Team IDs
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-text-main">
              {hasContract ? `${reservedMinted} / ${reservedSupply}` : `${config.reservedSupply} planned`}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              Token IDs 1-10 are blocked from public mint.
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Wallet Holdings
            </div>
            <div className="mt-2 text-xl font-heading font-bold text-text-main">
              {isConnected && hasContract ? holderBalance : 0}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              Public mint count: {isConnected && hasContract ? walletMintCount : 0} / {maxPerWallet}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
              Spendable Balance
            </div>
            <div className="mt-2 text-sm font-mono text-text-main">
              {isConnected ? `${formatBnb(nativeBalance)} ${nativeBalanceSymbol}` : `0 ${nativeBalanceSymbol}`}
            </div>
            <div className="mt-1 text-xs text-text-sub/70">
              {hasComboToken
                ? `${formatTokenAmount(tokenBalance, tokenDecimals)} ${tokenSymbol}`
                : `${tokenSymbol} route pending`}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-bg/70 p-4 sm:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
                  Treasury
                </div>
                <div className="mt-2 text-sm font-mono text-gold">
                  {treasuryAddress ? shortAddress(treasuryAddress) : 'Pending'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-text-sub/60">
                  Total Unminted
                </div>
                <div className="mt-1 text-lg font-heading font-bold text-gold">
                  {totalRemaining}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="grid gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
              Payment Method
            </div>
            <div className="mt-2 text-sm text-text-sub">
              Public mint has two routes: pure `0.099 BNB`, or `0.05 BNB +` the live on-chain `SKILL` quote for `0.099 BNB`, computed through the configured router and paid directly into treasury.
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-gold bg-gold/10 px-4 py-3 text-left text-gold">
              <div className="text-[11px] font-mono uppercase tracking-[0.25em]">Pure BNB</div>
              <div className="mt-2 text-lg font-heading font-bold">{formatBnb(priceWei)} BNB</div>
              <div className="mt-1 text-xs text-text-sub/70">
                No token leg. Keep a small extra BNB buffer for gas.
              </div>
            </div>
            <div
              className={`rounded-2xl border px-4 py-3 text-left ${
                comboRouteReady
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-white/10 bg-bg text-text-sub'
              }`}
            >
              <div className="text-[11px] font-mono uppercase tracking-[0.25em]">BNB + Skiller</div>
              <div className="mt-2 text-lg font-heading font-bold">
                {comboRouteReady
                  ? `${formatBnb(comboNativePrice)} BNB + ${formatTokenAmount(comboTokenQuote, tokenDecimals)} ${tokenSymbol}`
                  : 'Not configured'}
              </div>
              <div className="mt-1 text-xs text-text-sub/70">
                {comboRouteReady
                  ? `Quoted via router for ${formatBnb(comboQuoteNativeAmount)} BNB now. Balance: ${formatTokenAmount(tokenBalance, tokenDecimals)} ${tokenSymbol}`
                  : 'Owner must enable router-based combo mint first.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="grid gap-4">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
              Metadata URI
            </div>
            <div className="mt-2 text-sm text-text-sub">
              Leave empty to use `baseTokenURI + tokenId.json`, same pattern as `flap-nfa-mint`.
            </div>
            {config.baseUri ? (
              <div className="mt-2 break-all text-xs text-gold/80">
                Configured base URI: {config.baseUri}
              </div>
            ) : null}
            {config.contractUri ? (
              <div className="mt-1 break-all text-xs text-text-sub/80">
                Contract metadata: {config.contractUri}
              </div>
            ) : null}
          </div>
          <input
            type="text"
            value={metadataUri}
            onChange={(event) => setMetadataUri(event.target.value)}
            placeholder={metadataPlaceholder}
            className="rounded-xl border border-white/10 bg-bg px-4 py-3 text-sm text-text-main focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {!isConnected ? (
          <div className="grid gap-3">
            {connectors.map((item) => (
              <button
                key={item.uid}
                type="button"
                onClick={() => {
                  setLocalError('');
                  connect({ connector: item });
                }}
                disabled={connectPending}
                className="rounded-2xl border border-gold/20 bg-gold/10 px-5 py-3 text-sm font-heading font-bold text-gold transition-colors hover:border-gold hover:bg-gold hover:text-bg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {connectPending ? 'Connecting...' : `Connect ${connectorLabel(item.name)}`}
              </button>
            ))}
          </div>
        ) : !onBsc ? (
          <button
            type="button"
            onClick={() => {
              setLocalError('');
              switchChain({ chainId: config.chainId });
            }}
            disabled={switchPending}
            className="rounded-2xl bg-gold px-5 py-3 text-sm font-heading font-bold text-bg transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {switchPending ? 'Switching...' : 'Switch To BSC'}
          </button>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleMint('bnb')}
              disabled={pureMintDisabled}
              className="rounded-2xl bg-gold px-5 py-3 text-sm font-heading font-bold text-bg transition-colors hover:bg-gold-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {getMintButtonLabel('bnb')}
            </button>
            <button
              type="button"
              onClick={() => handleMint('combo')}
              disabled={comboMintDisabled}
              className="rounded-2xl border border-gold/30 bg-gold/10 px-5 py-3 text-sm font-heading font-bold text-gold transition-colors hover:border-gold hover:bg-gold hover:text-bg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {getMintButtonLabel('combo')}
            </button>
          </div>
        )}

        {isConnected ? (
          <button
            type="button"
            onClick={() => disconnect()}
            className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-mono uppercase tracking-[0.18em] text-text-sub transition-colors hover:border-gold/30 hover:text-gold"
          >
            Disconnect
          </button>
        ) : null}

        {surfaceError ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {surfaceError}
          </div>
        ) : null}

        {txHash ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Transaction sent:{' '}
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

      <div className="mt-6 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-gold/80">
          Launch Notes
        </div>
        <ul className="mt-3 space-y-2 text-sm text-text-sub">
          <li>Token IDs `1-10` are reserved for team-controlled free mint and never enter the public pool.</li>
          <li>Public mint starts at token ID `11`, with `89` public slots in total.</li>
          <li>Route A is fixed at `0.099 BNB`. Route B is fixed at `0.05 BNB + current router quote for 0.099 BNB worth of SKILL` sent to treasury.</li>
          <li>Combo mint requires a standard ERC20 `approve` transaction before the actual mint call.</li>
          <li>Set `NEXT_PUBLIC_NFA_CONTRACT_ADDRESS` after deployment. Token env values are only fallback display values; on-chain combo config is the source of truth.</li>
        </ul>
      </div>
    </div>
  );
}
