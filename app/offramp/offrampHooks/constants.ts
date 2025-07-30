import {scroll, base, arbitrum, polygon, celo, bsc} from 'viem/chains';

export type ChainId = 8453 | 42161 | 137 | 42220 | 56 | 534352;

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
  tokens: ['USDC'],
  chainIdHex: '0x2105',
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org']
};

export const ARBITRUM_CHAIN: ChainConfig = {
  id: 42161,
  name: 'Arbitrum One',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  explorerUrl: 'https://arbiscan.io',
  icon: '/arbitrum.svg',
  tokens: ['USDC', 'USDT'],
  chainIdHex: '0xa4b1',
  rpcUrls: ['https://arb1.arbitrum.io/rpc'],
  blockExplorerUrls: ['https://arbiscan.io']
};

export const POLYGON_CHAIN: ChainConfig = {
  id: 137,
  name: 'Polygon',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  rpcUrl: 'https://polygon-rpc.com',
  explorerUrl: 'https://polygonscan.com',
  icon: '/polygon.svg',
  tokens: ['USDC', 'USDT'],
  chainIdHex: '0x89',
  rpcUrls: ['https://polygon-rpc.com'],
  blockExplorerUrls: ['https://polygonscan.com']
};

export const CELO_CHAIN: ChainConfig = {
  id: 42220,
  name: 'Celo',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
  rpcUrl: 'https://forno.celo.org',
  explorerUrl: 'https://celoscan.io',
  icon: '/celo.svg',
  tokens: ['USDC', 'USDT'],
  chainIdHex: '0xa4ec',
  rpcUrls: ['https://forno.celo.org'],
  blockExplorerUrls: ['https://celoscan.io']
};

export const BNB_CHAIN: ChainConfig = {
  id: 56,
  name: 'BNB Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrl: 'https://bsc-dataseed1.bnbchain.org',
  explorerUrl: 'https://bscscan.com',
  icon: '/bnb.svg',
  tokens: ['USDC', 'USDT'],
  chainIdHex: '0x38',
  rpcUrls: ['https://bsc-dataseed1.bnbchain.org'],
  blockExplorerUrls: ['https://bscscan.com']
};

export const SCROLL_CHAIN: ChainConfig = {
  id: 534352,
  name: 'Scroll',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrl: scroll.rpcUrls.default.http[0],
  explorerUrl: 'https://scrollscan.com',
  icon: '/scroll.svg',
  tokens: ['USDC', 'USDT'],
  chainIdHex: '0x1537',
  rpcUrls: [scroll.rpcUrls.default.http[0],],
  blockExplorerUrls: ['https://scrollscan.com']
};

export const SUPPORTED_CHAINS = [BASE_CHAIN, BNB_CHAIN, ARBITRUM_CHAIN, POLYGON_CHAIN];
export const DEFAULT_CHAIN = BASE_CHAIN;