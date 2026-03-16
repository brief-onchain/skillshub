import { bsc } from 'viem/chains';
import { createPublicClient, http, isAddress, parseAbi, recoverMessageAddress } from 'viem';
import { skillGenesisNfaAbi } from '@/lib/nfa-contract';
import { getNfaPublicConfig } from '@/lib/server/nfa';

type AgentIdentity = {
  roleId: number;
  traitSeed: string;
  mintedAt: string;
};

type AgentState = {
  active: boolean;
  logicAddress: string;
  createdAt: string;
};

let publicClient: ReturnType<typeof createPublicClient> | null = null;
const dividendAbi = parseAbi([
  'function pendingDividend(address account) view returns (uint256)',
  'function claimDividend() returns (uint256)'
]);

function getClient() {
  if (publicClient) {
    return publicClient;
  }

  const config = getNfaPublicConfig();
  publicClient = createPublicClient({
    chain: bsc,
    transport: http(config.rpcUrl)
  });
  return publicClient;
}

function getContractAddress() {
  const config = getNfaPublicConfig();
  if (!config.contractAddress || !isAddress(config.contractAddress)) {
    throw new Error('NFA contract address is not configured');
  }
  return config.contractAddress as `0x${string}`;
}

export async function verifyWalletSignature({
  walletAddress,
  message,
  signature
}: {
  walletAddress: `0x${string}`;
  message: string;
  signature: `0x${string}`;
}) {
  const recovered = await recoverMessageAddress({
    message,
    signature
  });
  return recovered.toLowerCase() === walletAddress.toLowerCase();
}

export async function getTokenOwner(tokenId: number) {
  return await getClient().readContract({
    address: getContractAddress(),
    abi: skillGenesisNfaAbi,
    functionName: 'ownerOf',
    args: [BigInt(tokenId)]
  });
}

export async function assertTokenOwnership(tokenId: number, walletAddress: `0x${string}`) {
  const owner = await getTokenOwner(tokenId);
  return owner.toLowerCase() === walletAddress.toLowerCase();
}

export async function getAgentIdentity(tokenId: number): Promise<AgentIdentity> {
  const identity = await getClient().readContract({
    address: getContractAddress(),
    abi: skillGenesisNfaAbi,
    functionName: 'getAgentIdentity',
    args: [BigInt(tokenId)]
  });

  return {
    roleId: Number(identity[0]),
    traitSeed: String(identity[1]),
    mintedAt: identity[2].toString()
  };
}

export async function getAgentState(tokenId: number): Promise<AgentState & { owner: string }> {
  const state = await getClient().readContract({
    address: getContractAddress(),
    abi: skillGenesisNfaAbi,
    functionName: 'getAgentState',
    args: [BigInt(tokenId)]
  });

  return {
    active: Boolean(state[0]),
    logicAddress: String(state[1]),
    createdAt: state[2].toString(),
    owner: String(state[3])
  };
}

export async function getNfaBalance(walletAddress: `0x${string}`) {
  return await getClient().readContract({
    address: getContractAddress(),
    abi: skillGenesisNfaAbi,
    functionName: 'balanceOf',
    args: [walletAddress]
  });
}

export async function getPendingDividend(walletAddress: `0x${string}`) {
  const config = getNfaPublicConfig();
  if (!config.dividendContractAddress || !isAddress(config.dividendContractAddress)) {
    throw new Error('NFA dividend contract address is not configured');
  }

  return await getClient().readContract({
    address: config.dividendContractAddress as `0x${string}`,
    abi: dividendAbi,
    functionName: 'pendingDividend',
    args: [walletAddress]
  });
}
