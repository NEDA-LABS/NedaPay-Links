export interface ChainConfig {
    id: number;
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
  }
  
  export const BASE_CHAIN: ChainConfig = {
    id: 8453,
    name: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    icon: '/base.svg',
    tokens: ['USDC']
  };
  
  export const ARBITRUM_CHAIN: ChainConfig = {
    id: 42161,
    name: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    icon: '/arbitrum.svg',
    tokens: ['USDC', 'USDT']
  };
  
  export const POLYGON_CHAIN: ChainConfig = {
    id: 137,
    name: 'Polygon',
    nativeCurrency: { name: 'Matic', symbol: 'MATIC', decimals: 18 },
    rpcUrl: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    icon: '/polygon.svg',
    tokens: ['USDC', 'USDT']
  };
  
  export const CELO_CHAIN: ChainConfig = {
    id: 42220,
    name: 'Celo',
    nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 },
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    icon: '/celo.svg',
    tokens: ['USDC', 'USDT']
  };

  export const BNB_CHAIN: ChainConfig = {
    id: 56,
    name: 'BNB Chain',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrl: 'https://rpc.ankr.com/eth',
    explorerUrl: 'https://bscscan.com',
    icon: '/bnb.svg',
    tokens: ['USDC', 'USDT']
  };
  
  export const SUPPORTED_CHAINS = [BASE_CHAIN, ARBITRUM_CHAIN, POLYGON_CHAIN, CELO_CHAIN, BNB_CHAIN];
  export const DEFAULT_CHAIN = BASE_CHAIN;