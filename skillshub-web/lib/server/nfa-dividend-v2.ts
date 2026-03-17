import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  erc20Abi,
  type Hex,
  concatHex,
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  formatEther,
  http,
  isAddress,
  keccak256,
  parseEther,
  parseUnits
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { bsc } from 'viem/chains';
import { skillNfaDividendV2Abi } from '@/lib/nfa-dividend-contract';
import { skillGenesisNfaAbi } from '@/lib/nfa-contract';
import { ensureFlapEnvLoaded } from '@/lib/server/env';
import { getNfaPublicConfig } from '@/lib/server/nfa';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;
const DEFAULT_SKILL_PER_SHARE = '100000';
const DEFAULT_GAS_RESERVE = parseEther('0.01');

type HolderSnapshot = {
  account: `0x${string}`;
  nfaBalance: bigint;
  skillBalance: bigint;
  skillQualifiedShares: bigint;
  eligibleShares: bigint;
  amountWei: bigint;
};

type SnapshotEntryFile = {
  account: `0x${string}`;
  nfaBalance: string;
  skillBalance: string;
  skillQualifiedShares: string;
  eligibleShares: string;
  amountWei: string;
  proof: Hex[];
};

type SnapshotFile = {
  version: 1;
  roundId: number;
  contractAddress: `0x${string}`;
  skillTokenAddress: `0x${string}`;
  skillPerShareWei: string;
  snapshotBlock: string;
  snapshotURI: string;
  requestedAmountWei: string;
  allocatedAmountWei: string;
  dustWei: string;
  totalEligibleShares: string;
  txHash: `0x${string}`;
  createdAt: string;
  entries: SnapshotEntryFile[];
};

type PendingRound = {
  roundId: number;
  amountWei: string;
  amountBnb: string;
  eligibleShares: string;
  claimed: boolean;
  createdAt: string;
  snapshotBlock: string;
  proof: Hex[];
};

function pickFirst(...values: Array<string | undefined>) {
  return values.map((value) => String(value || '').trim()).find(Boolean) || '';
}

function sumBigInt(values: bigint[]) {
  return values.reduce((acc, value) => acc + value, BigInt(0));
}

function normalizeAddress(value: string) {
  return value.toLowerCase();
}

function getPublicClient() {
  const config = getNfaPublicConfig();
  return createPublicClient({
    chain: bsc,
    transport: http(config.rpcUrl)
  });
}

function getDividendContractAddress() {
  const config = getNfaPublicConfig();
  if (!config.dividendContractAddress || !isAddress(config.dividendContractAddress)) {
    throw new Error('NFA dividend contract address is not configured');
  }

  return config.dividendContractAddress as `0x${string}`;
}

function getSkillTokenAddress() {
  const config = getNfaPublicConfig();
  if (!config.paymentTokenAddress || !isAddress(config.paymentTokenAddress)) {
    throw new Error('NFA payment token address is not configured');
  }

  return config.paymentTokenAddress as `0x${string}`;
}

function getNfaContractAddress() {
  const config = getNfaPublicConfig();
  if (!config.contractAddress || !isAddress(config.contractAddress)) {
    throw new Error('NFA contract address is not configured');
  }

  return config.contractAddress as `0x${string}`;
}

function getSnapshotDirectory() {
  ensureFlapEnvLoaded();
  const configured = pickFirst(process.env.NFA_DIVIDEND_SNAPSHOT_DIR);
  return configured || path.join(process.cwd(), '.nfa-dividend-rounds');
}

async function ensureSnapshotDirectory() {
  const directory = getSnapshotDirectory();
  await mkdir(directory, { recursive: true });
  return directory;
}

function getSkillPerShareWei() {
  ensureFlapEnvLoaded();
  const raw = pickFirst(process.env.NFA_DIVIDEND_SKILL_PER_SHARE, DEFAULT_SKILL_PER_SHARE);
  return parseUnits(raw, 18);
}

function getRefillGasReserveWei() {
  ensureFlapEnvLoaded();
  const rawWei = pickFirst(process.env.NFA_DIVIDEND_GAS_RESERVE_WEI);
  if (rawWei) {
    return BigInt(rawWei);
  }

  const raw = pickFirst(process.env.NFA_DIVIDEND_GAS_RESERVE);
  if (raw) {
    return parseEther(raw);
  }

  return DEFAULT_GAS_RESERVE;
}

function getOperatorPrivateKey() {
  ensureFlapEnvLoaded();
  const privateKey = pickFirst(
    process.env.NFA_DIVIDEND_OPERATOR_PRIVATE_KEY,
    process.env.REWARD_WALLET_PRIVATE_KEY
  );

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      'Missing operator private key. Set NFA_DIVIDEND_OPERATOR_PRIVATE_KEY or REWARD_WALLET_PRIVATE_KEY.'
    );
  }

  return privateKey as `0x${string}`;
}

function getRefillPrivateKey() {
  ensureFlapEnvLoaded();
  const privateKey = pickFirst(
    process.env.NFA_DIVIDEND_REFILL_PRIVATE_KEY,
    process.env.NFA_DIVIDEND_OPERATOR_PRIVATE_KEY,
    process.env.REWARD_WALLET_PRIVATE_KEY
  );

  if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey)) {
    throw new Error(
      'Missing refill private key. Set NFA_DIVIDEND_REFILL_PRIVATE_KEY or fall back to NFA_DIVIDEND_OPERATOR_PRIVATE_KEY.'
    );
  }

  return privateKey as `0x${string}`;
}

function getWalletClients(privateKey: `0x${string}`) {
  const config = getNfaPublicConfig();
  const account = privateKeyToAccount(privateKey);
  const transport = http(config.rpcUrl);

  return {
    account,
    publicClient: createPublicClient({
      chain: bsc,
      transport
    }),
    walletClient: createWalletClient({
      account,
      chain: bsc,
      transport
    })
  };
}

function toSnapshotFileName(roundId: number) {
  return `round-${roundId}.json`;
}

async function writeSnapshotFile(snapshot: SnapshotFile) {
  const directory = await ensureSnapshotDirectory();
  const filePath = path.join(directory, toSnapshotFileName(snapshot.roundId));
  await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf8');
  return filePath;
}

async function listSnapshotFiles() {
  const directory = await ensureSnapshotDirectory();
  const names = await readdir(directory);
  return names
    .filter((name) => /^round-\d+\.json$/.test(name))
    .sort((left, right) => {
      const leftId = Number.parseInt(left.replace(/\D/g, ''), 10);
      const rightId = Number.parseInt(right.replace(/\D/g, ''), 10);
      return leftId - rightId;
    })
    .map((name) => path.join(directory, name));
}

async function loadAllSnapshots() {
  const files = await listSnapshotFiles();
  const snapshots = await Promise.all(
    files.map(async (filePath) => {
      const raw = await readFile(filePath, 'utf8');
      return JSON.parse(raw) as SnapshotFile;
    })
  );

  return snapshots.sort((left, right) => left.roundId - right.roundId);
}

function hashLeaf(roundId: number, account: `0x${string}`, eligibleShares: bigint, amountWei: bigint) {
  const inner = keccak256(
    encodeAbiParameters(
      [
        { type: 'uint256' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'uint256' }
      ],
      [BigInt(roundId), account, eligibleShares, amountWei]
    )
  );

  return keccak256(inner);
}

function hashPair(left: Hex, right: Hex) {
  if (left.toLowerCase() === right.toLowerCase()) {
    return keccak256(concatHex([left, right]));
  }

  const ordered = BigInt(left) < BigInt(right) ? [left, right] : [right, left];
  return keccak256(concatHex(ordered));
}

function buildMerkleTree(leaves: Hex[]) {
  if (leaves.length === 0) {
    throw new Error('Cannot build merkle tree without leaves');
  }

  const layers: Hex[][] = [leaves];

  while (layers[layers.length - 1].length > 1) {
    const current = layers[layers.length - 1];
    const next: Hex[] = [];

    for (let index = 0; index < current.length; index += 2) {
      const left = current[index];
      const right = current[index + 1];
      next.push(right ? hashPair(left, right) : left);
    }

    layers.push(next);
  }

  const proofs = leaves.map((_, leafIndex) => {
    let index = leafIndex;
    const proof: Hex[] = [];

    for (let layerIndex = 0; layerIndex < layers.length - 1; layerIndex += 1) {
      const layer = layers[layerIndex];
      const siblingIndex = index ^ 1;
      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }
      index = Math.floor(index / 2);
    }

    return proof;
  });

  return {
    root: layers[layers.length - 1][0],
    proofs
  };
}

async function collectHolderSnapshot(blockNumber: bigint) {
  const publicClient = getPublicClient();
  const nfaContract = getNfaContractAddress();
  const skillToken = getSkillTokenAddress();
  const skillPerShareWei = getSkillPerShareWei();

  const totalSupply = await publicClient.readContract({
    address: nfaContract,
    abi: skillGenesisNfaAbi,
    functionName: 'totalSupply',
    blockNumber
  });

  const balances = new Map<string, bigint>();

  for (let tokenId = BigInt(1); tokenId <= totalSupply; tokenId += BigInt(1)) {
    const owner = await publicClient.readContract({
      address: nfaContract,
      abi: skillGenesisNfaAbi,
      functionName: 'ownerOf',
      args: [tokenId],
      blockNumber
    });

    const key = normalizeAddress(owner);
    balances.set(key, (balances.get(key) || BigInt(0)) + BigInt(1));
  }

  const holders = Array.from(balances.entries())
    .map(([account, nfaBalance]) => ({
      account: account as `0x${string}`,
      nfaBalance
    }))
    .sort((left, right) => left.account.localeCompare(right.account));

  const snapshot: HolderSnapshot[] = [];

  for (const holder of holders) {
    const skillBalance = await publicClient.readContract({
      address: skillToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [holder.account],
      blockNumber
    });
    const skillQualifiedShares = skillBalance / skillPerShareWei;
    const eligibleShares =
      holder.nfaBalance < skillQualifiedShares ? holder.nfaBalance : skillQualifiedShares;

    snapshot.push({
      account: holder.account,
      nfaBalance: holder.nfaBalance,
      skillBalance,
      skillQualifiedShares,
      eligibleShares,
      amountWei: BigInt(0)
    });
  }

  return {
    totalSupply,
    skillToken,
    skillPerShareWei,
    snapshot
  };
}

async function getCurrentQualification(walletAddress: `0x${string}`) {
  const publicClient = getPublicClient();
  const nfaContract = getNfaContractAddress();
  const skillToken = getSkillTokenAddress();
  const skillPerShareWei = getSkillPerShareWei();

  const [nfaBalance, skillBalance] = await Promise.all([
    publicClient.readContract({
      address: nfaContract,
      abi: skillGenesisNfaAbi,
      functionName: 'balanceOf',
      args: [walletAddress]
    }),
    publicClient.readContract({
      address: skillToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress]
    })
  ]);

  const skillQualifiedShares = skillBalance / skillPerShareWei;
  const eligibleShares = nfaBalance < skillQualifiedShares ? nfaBalance : skillQualifiedShares;

  return {
    walletAddress,
    nfaBalance,
    skillBalance,
    skillQualifiedShares,
    eligibleShares
  };
}

async function getRoundCountIfV2(dividendContract: `0x${string}`) {
  const publicClient = getPublicClient();

  try {
    return await publicClient.readContract({
      address: dividendContract,
      abi: skillNfaDividendV2Abi,
      functionName: 'roundCount'
    });
  } catch {
    return null;
  }
}

function resolveRefillAmount(
  walletBalance: bigint,
  input: {
    amountWei?: string;
    amount?: string;
  }
) {
  const reserve = getRefillGasReserveWei();
  const available = walletBalance > reserve ? walletBalance - reserve : BigInt(0);

  const rawAmountWei = String(input.amountWei || '').trim();
  if (rawAmountWei) {
    const parsed = BigInt(rawAmountWei);
    if (parsed > available) {
      throw new Error('Requested refill amount exceeds wallet balance after gas reserve');
    }
    return {
      amount: parsed,
      reserve
    };
  }

  const rawAmount = String(input.amount || '').trim();
  if (rawAmount) {
    const parsed = parseEther(rawAmount);
    if (parsed > available) {
      throw new Error('Requested refill amount exceeds wallet balance after gas reserve');
    }
    return {
      amount: parsed,
      reserve
    };
  }

  const fallbackRawWei = pickFirst(process.env.NFA_DIVIDEND_REFILL_AMOUNT_WEI);
  if (fallbackRawWei) {
    const parsed = BigInt(fallbackRawWei);
    if (parsed > available) {
      throw new Error('Configured refill amount exceeds wallet balance after gas reserve');
    }
    return {
      amount: parsed,
      reserve
    };
  }

  const fallbackRaw = pickFirst(process.env.NFA_DIVIDEND_REFILL_AMOUNT);
  if (fallbackRaw) {
    const parsed = parseEther(fallbackRaw);
    if (parsed > available) {
      throw new Error('Configured refill amount exceeds wallet balance after gas reserve');
    }
    return {
      amount: parsed,
      reserve
    };
  }

  return {
    amount: available,
    reserve
  };
}

function resolveDistributionAmount(
  availableUnallocated: bigint,
  input: {
    amountWei?: string;
    amount?: string;
  }
) {
  const rawAmountWei = String(input.amountWei || '').trim();
  if (rawAmountWei) {
    const parsed = BigInt(rawAmountWei);
    if (parsed > availableUnallocated) {
      throw new Error('Requested distribution amount exceeds unallocated contract balance');
    }
    return parsed;
  }

  const rawAmount = String(input.amount || '').trim();
  if (rawAmount) {
    const parsed = parseEther(rawAmount);
    if (parsed > availableUnallocated) {
      throw new Error('Requested distribution amount exceeds unallocated contract balance');
    }
    return parsed;
  }

  return availableUnallocated;
}

export async function refillDividendContract(input: {
  amountWei?: string;
  amount?: string;
}) {
  const { account, publicClient, walletClient } = getWalletClients(getRefillPrivateKey());
  const dividendContract = getDividendContractAddress();
  const walletBalanceBefore = await publicClient.getBalance({
    address: account.address
  });
  const { amount, reserve } = resolveRefillAmount(walletBalanceBefore, input);

  if (amount <= BigInt(0)) {
    throw new Error('No refill amount available after preserving gas reserve');
  }

  const hash = await walletClient.sendTransaction({
    account,
    to: dividendContract,
    value: amount
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  const walletBalanceAfter = await publicClient.getBalance({
    address: account.address
  });

  return {
    hash,
    receipt: {
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      transactionHash: receipt.transactionHash
    },
    asset: 'BNB',
    amount: amount.toString(),
    amountDisplay: formatEther(amount),
    refillWallet: account.address,
    refillWalletBalanceBefore: walletBalanceBefore.toString(),
    refillWalletBalanceAfter: walletBalanceAfter.toString(),
    gasReserveWei: reserve.toString(),
    dividendContract
  };
}

export async function createDividendDistributionRound(input: {
  amountWei?: string;
  amount?: string;
}) {
  const { account, publicClient, walletClient } = getWalletClients(getOperatorPrivateKey());
  const dividendContract = getDividendContractAddress();
  const currentRoundCount = await getRoundCountIfV2(dividendContract);
  if (currentRoundCount === null) {
    throw new Error('Configured dividend contract is not Dividend V2 yet');
  }

  const [availableUnallocated, snapshotBlock] = await Promise.all([
    publicClient.readContract({
      address: dividendContract,
      abi: skillNfaDividendV2Abi,
      functionName: 'availableUnallocated'
    }),
    publicClient.getBlockNumber()
  ]);

  const requestedAmountWei = resolveDistributionAmount(availableUnallocated, input);
  if (requestedAmountWei <= BigInt(0)) {
    throw new Error('No unallocated dividend balance available for a new round');
  }

  const nextRoundId = Number(currentRoundCount) + 1;
  const { skillToken, skillPerShareWei, snapshot } = await collectHolderSnapshot(snapshotBlock);
  const totalEligibleShares = sumBigInt(snapshot.map((entry) => entry.eligibleShares));
  if (totalEligibleShares <= BigInt(0)) {
    throw new Error('No holders qualify for this dividend round at the current snapshot');
  }

  const eligibleSnapshot = snapshot
    .filter((entry) => entry.eligibleShares > BigInt(0))
    .map((entry) => ({
      ...entry,
      amountWei: (requestedAmountWei * entry.eligibleShares) / totalEligibleShares
    }));

  const claimableEntries = eligibleSnapshot.filter((entry) => entry.amountWei > BigInt(0));
  if (claimableEntries.length === 0) {
    throw new Error('Snapshot produced zero claimable allocations');
  }

  const leaves = claimableEntries.map((entry) =>
    hashLeaf(nextRoundId, entry.account, entry.eligibleShares, entry.amountWei)
  );
  const tree = buildMerkleTree(leaves);
  const allocatedAmountWei = sumBigInt(claimableEntries.map((entry) => entry.amountWei));
  const dustWei = requestedAmountWei - allocatedAmountWei;
  const proofByAccount = new Map(
    claimableEntries.map((entry, index) => [normalizeAddress(entry.account), tree.proofs[index]])
  );
  const snapshotURI = `local://nfa-dividend/round-${nextRoundId}.json`;

  const hash = await walletClient.writeContract({
    account,
    address: dividendContract,
    abi: skillNfaDividendV2Abi,
    functionName: 'createRound',
    args: [tree.root, allocatedAmountWei, totalEligibleShares, snapshotURI]
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const snapshotFile: SnapshotFile = {
    version: 1,
    roundId: nextRoundId,
    contractAddress: dividendContract,
    skillTokenAddress: skillToken,
    skillPerShareWei: skillPerShareWei.toString(),
    snapshotBlock: snapshotBlock.toString(),
    snapshotURI,
    requestedAmountWei: requestedAmountWei.toString(),
    allocatedAmountWei: allocatedAmountWei.toString(),
    dustWei: dustWei.toString(),
    totalEligibleShares: totalEligibleShares.toString(),
    txHash: hash,
    createdAt: new Date().toISOString(),
    entries: snapshot.map((entry) => ({
      account: entry.account,
      nfaBalance: entry.nfaBalance.toString(),
      skillBalance: entry.skillBalance.toString(),
      skillQualifiedShares: entry.skillQualifiedShares.toString(),
      eligibleShares: entry.eligibleShares.toString(),
      amountWei: (eligibleSnapshot.find(
        (candidate) => normalizeAddress(candidate.account) === normalizeAddress(entry.account)
      )?.amountWei || BigInt(0)).toString(),
      proof: proofByAccount.get(normalizeAddress(entry.account)) || []
    }))
  };

  const snapshotPath = await writeSnapshotFile(snapshotFile);

  return {
    hash,
    receipt: {
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      transactionHash: receipt.transactionHash
    },
    roundId: nextRoundId,
    merkleRoot: tree.root,
    requestedAmountWei: requestedAmountWei.toString(),
    allocatedAmountWei: allocatedAmountWei.toString(),
    allocatedAmountBnb: formatEther(allocatedAmountWei),
    dustWei: dustWei.toString(),
    totalEligibleShares: totalEligibleShares.toString(),
    qualifiedHolderCount: snapshot.filter((entry) => entry.eligibleShares > BigInt(0)).length,
    claimableHolderCount: claimableEntries.length,
    snapshotBlock: snapshotBlock.toString(),
    snapshotURI,
    snapshotPath,
    operator: account.address
  };
}

export async function getDividendPendingSummary(walletAddress: `0x${string}`) {
  const dividendContract = getDividendContractAddress();
  const current = await getCurrentQualification(walletAddress);
  const onChainRoundCount = await getRoundCountIfV2(dividendContract);

  if (onChainRoundCount === null) {
    return {
      contractAddress: dividendContract,
      contractVersion: 'legacy' as const,
      pendingWei: '0',
      pendingBnb: '0',
      claimableRounds: 0,
      currentQualification: {
        walletAddress,
        nfaBalance: current.nfaBalance.toString(),
        skillBalance: current.skillBalance.toString(),
        skillQualifiedShares: current.skillQualifiedShares.toString(),
        eligibleShares: current.eligibleShares.toString()
      },
      rounds: [] as PendingRound[],
      claimPayload: {
        roundIds: [] as number[],
        eligibleShares: [] as string[],
        amounts: [] as string[],
        proofs: [] as Hex[][]
      },
      warnings: ['Configured dividend contract is still legacy. Switch Genesis to Dividend V2 first.']
    };
  }

  const publicClient = getPublicClient();
  const snapshots = await loadAllSnapshots();
  const snapshotsForContract = snapshots.filter(
    (snapshot) => normalizeAddress(snapshot.contractAddress) === normalizeAddress(dividendContract)
  );
  const pendingRounds: PendingRound[] = [];
  const warnings: string[] = [];

  for (const snapshot of snapshotsForContract) {
    const entry = snapshot.entries.find(
      (candidate) => normalizeAddress(candidate.account) === normalizeAddress(walletAddress)
    );
    if (!entry || BigInt(entry.amountWei) <= BigInt(0)) {
      continue;
    }

    const claimed = await publicClient.readContract({
      address: dividendContract,
      abi: skillNfaDividendV2Abi,
      functionName: 'isClaimed',
      args: [BigInt(snapshot.roundId), walletAddress]
    });

    pendingRounds.push({
      roundId: snapshot.roundId,
      amountWei: entry.amountWei,
      amountBnb: formatEther(BigInt(entry.amountWei)),
      eligibleShares: entry.eligibleShares,
      claimed,
      createdAt: snapshot.createdAt,
      snapshotBlock: snapshot.snapshotBlock,
      proof: entry.proof
    });
  }

  const unclaimedRounds = pendingRounds.filter((round) => !round.claimed);
  const pendingWei = sumBigInt(unclaimedRounds.map((round) => BigInt(round.amountWei)));

  if (snapshots.length === 0) {
    warnings.push('No local dividend round snapshots found yet');
  }
  if (snapshotsForContract.length < Number(onChainRoundCount)) {
    warnings.push('Some on-chain dividend rounds are missing local snapshot files');
  }

  return {
    contractAddress: dividendContract,
    contractVersion: 'v2' as const,
    pendingWei: pendingWei.toString(),
    pendingBnb: formatEther(pendingWei),
    claimableRounds: unclaimedRounds.length,
    currentQualification: {
      walletAddress,
      nfaBalance: current.nfaBalance.toString(),
      skillBalance: current.skillBalance.toString(),
      skillQualifiedShares: current.skillQualifiedShares.toString(),
      eligibleShares: current.eligibleShares.toString()
    },
    rounds: pendingRounds.sort((left, right) => left.roundId - right.roundId),
    claimPayload: {
      roundIds: unclaimedRounds.map((round) => round.roundId),
      eligibleShares: unclaimedRounds.map((round) => round.eligibleShares),
      amounts: unclaimedRounds.map((round) => round.amountWei),
      proofs: unclaimedRounds.map((round) => round.proof)
    },
    warnings
  };
}
