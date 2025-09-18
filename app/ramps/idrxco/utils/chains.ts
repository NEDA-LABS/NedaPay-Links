// app/idrxco/utils/chains.ts
// Minimal chain config and supported networks for IDRX flows

export type ChainId = 8453 | 137 | 56;

export interface ChainConfig {
  id: ChainId;
  name: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: 18;
  };
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
  tokens: string[];
  chainIdHex: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
}

export const BASE_CHAIN: ChainConfig = {
  id: 8453,
  name: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://mainnet.base.org',
  explorerUrl: 'https://basescan.org',
  icon: '/base.svg',
  tokens: ['IDRX'],
  chainIdHex: '0x2105',
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const POLYGON_CHAIN: ChainConfig = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrl: 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  icon: '/polygon.svg',
  tokens: ['IDRX'],
  chainIdHex: '0x89',
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com'],
};

export const BNB_CHAIN: ChainConfig = {
  id: 56,
  name: 'BSC',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrl: 'https://bsc-dataseed1.bnbchain.org',
  explorerUrl: 'https://bscscan.com',
  icon: '/bnb.svg',
  tokens: ['IDRX'],
  chainIdHex: '0x38',
  rpcUrls: ['https://bsc-dataseed1.bnbchain.org'],
  blockExplorerUrls: ['https://bscscan.com'],
};

export const SUPPORTED_CHAINS_IDRX: ChainConfig[] = [BASE_CHAIN, POLYGON_CHAIN, BNB_CHAIN];
export const SUPPORTED_CHAINS_NORMAL = SUPPORTED_CHAINS_IDRX;
export const DEFAULT_CHAIN: ChainConfig = BNB_CHAIN;

// Optional: IDRX contract addresses per supported chain if needed by Web3Service
export const IDRX_CONTRACT_ADDRESSES: Record<ChainId, string> = {
  8453: '0x18Bc5bcC660cf2B9cE3cd51a404aFe1a0cBD3C22', // Base Mainnet
  137: '0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC', // Polygon Mainnet
  56: '0x649a2DA7B28E0D54c13D5eFf95d3A660652742cC',  // BNB Smart Chain
};
