export const SITE = {
  contractAddress: process.env.NEXT_PUBLIC_NFA_CONTRACT_ADDRESS || '',
  twitterUrl: 'https://x.com/errodenos133734',
  bscscanAddressUrl: process.env.NEXT_PUBLIC_NFA_CONTRACT_ADDRESS
    ? `https://bscscan.com/address/${process.env.NEXT_PUBLIC_NFA_CONTRACT_ADDRESS}`
    : 'https://bscscan.com'
} as const;
