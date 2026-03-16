import { parseEther } from 'viem';

export const NFA_CHAIN_ID = 56;
export const NFA_CHAIN_HEX = '0x38';
export const NFA_COLLECTION_NAME = 'skillhub-nfa-genesis';
export const NFA_COLLECTION_SYMBOL = 'SNFA';
export const NFA_PRICE_BNB = '0.099';
export const NFA_PRICE_WEI = parseEther(NFA_PRICE_BNB).toString();
export const NFA_COMBO_BNB = '0.05';
export const NFA_COMBO_PRICE_WEI = parseEther(NFA_COMBO_BNB).toString();
export const NFA_MAX_SUPPLY = 99;
export const NFA_RESERVED_SUPPLY = 10;
export const NFA_PUBLIC_SUPPLY = 89;
export const NFA_MAX_PER_WALLET = 15;
export const NFA_EXPLORER_BASE_URL = 'https://bscscan.com';
export const NFA_DEFAULT_RPC_URL = 'https://bsc-dataseed.binance.org/';

export interface NfaPublicConfig {
  chainId: number;
  chainHex: string;
  collectionName: string;
  symbol: string;
  priceBnb: string;
  priceWei: string;
  comboPriceBnb: string;
  comboPriceWei: string;
  maxSupply: number;
  reservedSupply: number;
  publicSupply: number;
  maxPerWallet: number;
  explorerBaseUrl: string;
  rpcUrl: string;
  walletConnectProjectId: string;
  contractAddress: string;
  paymentTokenAddress: string;
  paymentTokenSymbol: string;
  paymentTokenDecimals: number;
  dividendContractAddress: string;
  baseUri: string;
  contractUri: string;
  mintLive: boolean;
}
