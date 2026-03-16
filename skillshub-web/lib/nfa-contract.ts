export const skillGenesisNfaAbi = [
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'mintNFA',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'payable',
    name: 'mintNFAWithSkiller',
    inputs: [{ name: 'metadataURI', type: 'string' }],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'nonpayable',
    name: 'mintReservedNFA',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'metadataURI', type: 'string' }
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'balanceOf',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'ownerOf',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'totalSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'maxSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'reservedSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'publicSupply',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'maxPerWallet',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'mintFee',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'paymentTreasury',
    inputs: [],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'comboMintConfig',
    inputs: [],
    outputs: [
      { name: 'enabled', type: 'bool' },
      { name: 'paymentToken', type: 'address' },
      { name: 'quoteRouter', type: 'address' },
      { name: 'nativeMintPrice', type: 'uint256' },
      { name: 'quoteNativeAmount', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'quoteSkillerForMint',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'saleActive',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'walletMintCount',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'reservedMintedCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'publicMintedCount',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'tokenOfOwnerByIndex',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'index', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getAgentIdentity',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'roleId', type: 'uint8' },
      { name: 'traitSeed', type: 'bytes32' },
      { name: 'mintedAt', type: 'uint256' }
    ]
  },
  {
    type: 'function',
    stateMutability: 'view',
    name: 'getAgentState',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [
      { name: 'active', type: 'bool' },
      { name: 'logicAddress', type: 'address' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'owner', type: 'address' }
    ]
  }
] as const;
