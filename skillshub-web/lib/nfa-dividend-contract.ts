export const skillNfaDividendV2Abi = [
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'createRound',
    inputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'totalEligibleShares', type: 'uint256' },
      { name: 'snapshotURI', type: 'string' }
    ],
    outputs: [{ name: 'roundId', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'claim',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'eligibleShares', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' }
    ],
    outputs: [{ name: 'claimedAmount', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'claimMany',
    inputs: [
      { name: 'roundIds', type: 'uint256[]' },
      { name: 'eligibleShares', type: 'uint256[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'proofs', type: 'bytes32[][]' }
    ],
    outputs: [{ name: 'totalAmountClaimed', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'availableUnallocated',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'roundCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getRound',
    inputs: [{ name: 'roundId', type: 'uint256' }],
    outputs: [
      { name: 'merkleRoot', type: 'bytes32' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'totalEligibleShares', type: 'uint256' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'snapshotURI', type: 'string' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'hashLeaf',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'account', type: 'address' },
      { name: 'eligibleShares', type: 'uint256' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bytes32' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'isClaimed',
    inputs: [
      { name: 'roundId', type: 'uint256' },
      { name: 'account', type: 'address' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const;
