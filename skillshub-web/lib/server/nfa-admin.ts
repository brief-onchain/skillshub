import { erc20Abi, createPublicClient, createWalletClient, formatEther, formatUnits, http, isAddress, parseEther, parseUnits } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { ensureFlapEnvLoaded } from '@/lib/server/env';
import { getNfaPublicConfig } from '@/lib/server/nfa';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const dividendAbi = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'distribute',
    inputs: [],
    outputs: []
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'rewardToken',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  }
] as const;

type DividendAssetMeta = {
  address: `0x${string}`;
  decimals: number;
  symbol: string;
  isNative: boolean;
};

function summarizeReceipt(receipt: {
  blockNumber: bigint;
  gasUsed: bigint;
  status: string;
  transactionHash: `0x${string}`;
}) {
  return {
    blockNumber: receipt.blockNumber.toString(),
    gasUsed: receipt.gasUsed.toString(),
    status: receipt.status,
    transactionHash: receipt.transactionHash
  };
}

function pickFirst(...values: Array<string | undefined>) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

function getCronSecret() {
  ensureFlapEnvLoaded();
  return pickFirst(process.env.CRON_SECRET);
}

export function verifyCronRequest(request: Request) {
  const cronSecret = getCronSecret();
  if (!cronSecret) {
    return { ok: false as const, error: 'CRON_SECRET is not configured' };
  }

  const url = new URL(request.url);
  const authHeader = request.headers.get('authorization') || '';
  const bearerToken = authHeader.replace(/^Bearer\s+/i, '').trim();
  const headerToken = (request.headers.get('x-cron-secret') || '').trim();
  const queryToken = (url.searchParams.get('secret') || '').trim();
  const provided = bearerToken || headerToken || queryToken;

  if (!provided || provided !== cronSecret) {
    return { ok: false as const, error: 'Unauthorized cron request' };
  }

  return { ok: true as const };
}

function getDividendContractAddress() {
  const config = getNfaPublicConfig();
  const address = pickFirst(config.dividendContractAddress, process.env.NFA_DIVIDEND_CONTRACT_ADDRESS);

  if (!address || !isAddress(address)) {
    throw new Error('NFA dividend contract address is not configured');
  }

  return address as `0x${string}`;
}

function getOperatorAccount() {
  ensureFlapEnvLoaded();
  const privateKey = pickFirst(
    process.env.NFA_DIVIDEND_OPERATOR_PRIVATE_KEY,
    process.env.REWARD_WALLET_PRIVATE_KEY
  );

  if (!privateKey || !/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      'Missing operator private key. Set NFA_DIVIDEND_OPERATOR_PRIVATE_KEY or reuse REWARD_WALLET_PRIVATE_KEY.'
    );
  }

  return privateKeyToAccount(privateKey as `0x${string}`);
}

function getClients() {
  const config = getNfaPublicConfig();
  const account = getOperatorAccount();
  const transport = http(config.rpcUrl);

  const publicClient = createPublicClient({
    chain: bsc,
    transport
  });
  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport
  });

  return {
    account,
    publicClient,
    walletClient,
    dividendContract: getDividendContractAddress()
  };
}

async function getDividendAssetMeta() {
  const { publicClient, dividendContract } = getClients();
  const rewardTokenAddress = await publicClient.readContract({
    address: dividendContract,
    abi: dividendAbi,
    functionName: 'rewardToken'
  });

  if (!rewardTokenAddress || rewardTokenAddress === ZERO_ADDRESS) {
    return {
      address: ZERO_ADDRESS,
      decimals: 18,
      symbol: 'BNB',
      isNative: true
    } satisfies DividendAssetMeta;
  }

  let decimals = 18;
  let symbol = 'TOKEN';

  try {
    decimals = Number(
      await publicClient.readContract({
        address: rewardTokenAddress,
        abi: erc20Abi,
        functionName: 'decimals'
      })
    );
  } catch {}

  try {
    symbol = String(
      await publicClient.readContract({
        address: rewardTokenAddress,
        abi: erc20Abi,
        functionName: 'symbol'
      })
    );
  } catch {}

  return {
    address: rewardTokenAddress,
    decimals,
    symbol,
    isNative: false
  } satisfies DividendAssetMeta;
}

async function resolveRefillAmount(
  meta: DividendAssetMeta,
  input: {
    amountWei?: string;
    amount?: string;
  }
) {
  const rawAmount = String(input.amountWei || '').trim();
  if (rawAmount) {
    return BigInt(rawAmount);
  }

  const humanAmount = String(input.amount || '').trim();
  if (humanAmount) {
    return meta.isNative ? parseEther(humanAmount) : parseUnits(humanAmount, meta.decimals);
  }

  const fallbackRaw = pickFirst(process.env.NFA_DIVIDEND_REFILL_AMOUNT_WEI);
  if (fallbackRaw) {
    return BigInt(fallbackRaw);
  }

  const fallbackHuman = pickFirst(process.env.NFA_DIVIDEND_REFILL_AMOUNT);
  if (fallbackHuman) {
    return meta.isNative ? parseEther(fallbackHuman) : parseUnits(fallbackHuman, meta.decimals);
  }

  throw new Error(
    'Missing refill amount. Pass amountWei/amount, or set NFA_DIVIDEND_REFILL_AMOUNT_WEI/NFA_DIVIDEND_REFILL_AMOUNT.'
  );
}

export async function refillDividendContract(input: {
  amountWei?: string;
  amount?: string;
}) {
  const meta = await getDividendAssetMeta();
  const { account, publicClient, walletClient, dividendContract } = getClients();
  const amount = await resolveRefillAmount(meta, input);

  if (amount <= BigInt(0)) {
    throw new Error('Refill amount must be greater than zero');
  }

  let hash: `0x${string}`;
  if (meta.isNative) {
    hash = await walletClient.sendTransaction({
      account,
      to: dividendContract,
      value: amount
    });
  } else {
    hash = await walletClient.writeContract({
      account,
      address: meta.address,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [dividendContract, amount]
    });
  }

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    receipt: summarizeReceipt(receipt),
    asset: meta.symbol,
    assetAddress: meta.address,
    amount: amount.toString(),
    amountDisplay: meta.isNative ? formatEther(amount) : formatUnits(amount, meta.decimals),
    operator: account.address
  };
}

export async function distributeDividend() {
  const { account, publicClient, walletClient, dividendContract } = getClients();

  const hash = await walletClient.writeContract({
    account,
    address: dividendContract,
    abi: dividendAbi,
    functionName: 'distribute'
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return {
    hash,
    receipt: summarizeReceipt(receipt),
    operator: account.address,
    dividendContract
  };
}
