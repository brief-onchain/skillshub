import {
  NFA_CHAIN_HEX,
  NFA_CHAIN_ID,
  NFA_COLLECTION_NAME,
  NFA_COLLECTION_SYMBOL,
  NFA_COMBO_BNB,
  NFA_COMBO_PRICE_WEI,
  NFA_DEFAULT_RPC_URL,
  NFA_EXPLORER_BASE_URL,
  NFA_MAX_PER_WALLET,
  NFA_MAX_SUPPLY,
  NFA_PRICE_BNB,
  NFA_PRICE_WEI,
  NFA_PUBLIC_SUPPLY,
  NFA_RESERVED_SUPPLY,
  type NfaPublicConfig
} from '@/lib/nfa';
import { ensureFlapEnvLoaded } from '@/lib/server/env';

function pickFirst(...values: Array<string | undefined>) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

function parseDecimals(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 255) {
    return fallback;
  }
  return parsed;
}

export function getNfaPublicConfig(): NfaPublicConfig {
  ensureFlapEnvLoaded();

  const contractAddress = pickFirst(
    process.env.NEXT_PUBLIC_NFA_CONTRACT_ADDRESS,
    process.env.NFA_CONTRACT_ADDRESS
  );
  const walletConnectProjectId = pickFirst(
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
    process.env.WALLETCONNECT_PROJECT_ID
  );
  const rpcUrl = pickFirst(
    process.env.NEXT_PUBLIC_BSC_RPC_URL,
    process.env.BSC_RPC_URL,
    process.env.BSC_RPC_URL_1,
    process.env.BSC_MAINNET_RPC_URL,
    NFA_DEFAULT_RPC_URL
  );
  const paymentTokenAddress = pickFirst(
    process.env.NEXT_PUBLIC_NFA_PAYMENT_TOKEN_ADDRESS,
    process.env.NFA_PAYMENT_TOKEN_ADDRESS
  );
  const paymentTokenSymbol = pickFirst(
    process.env.NEXT_PUBLIC_NFA_PAYMENT_TOKEN_SYMBOL,
    process.env.NFA_PAYMENT_TOKEN_SYMBOL,
    'TOKEN'
  );
  const paymentTokenDecimals = parseDecimals(
    pickFirst(
      process.env.NEXT_PUBLIC_NFA_PAYMENT_TOKEN_DECIMALS,
      process.env.NFA_PAYMENT_TOKEN_DECIMALS,
      '18'
    ),
    18
  );
  const dividendContractAddress = pickFirst(
    process.env.NEXT_PUBLIC_NFA_DIVIDEND_CONTRACT_ADDRESS,
    process.env.NFA_DIVIDEND_CONTRACT_ADDRESS
  );
  const baseUri = pickFirst(
    process.env.NEXT_PUBLIC_NFA_BASE_URI,
    process.env.NFA_BASE_URI
  );
  const contractUri = pickFirst(
    process.env.NEXT_PUBLIC_NFA_CONTRACT_URI,
    process.env.NFA_CONTRACT_URI
  );

  return {
    chainId: NFA_CHAIN_ID,
    chainHex: NFA_CHAIN_HEX,
    collectionName: NFA_COLLECTION_NAME,
    symbol: NFA_COLLECTION_SYMBOL,
    priceBnb: NFA_PRICE_BNB,
    priceWei: NFA_PRICE_WEI,
    comboPriceBnb: NFA_COMBO_BNB,
    comboPriceWei: NFA_COMBO_PRICE_WEI,
    maxSupply: NFA_MAX_SUPPLY,
    reservedSupply: NFA_RESERVED_SUPPLY,
    publicSupply: NFA_PUBLIC_SUPPLY,
    maxPerWallet: NFA_MAX_PER_WALLET,
    explorerBaseUrl: NFA_EXPLORER_BASE_URL,
    rpcUrl,
    walletConnectProjectId,
    contractAddress,
    paymentTokenAddress,
    paymentTokenSymbol,
    paymentTokenDecimals,
    dividendContractAddress,
    baseUri,
    contractUri,
    mintLive: Boolean(contractAddress)
  };
}
