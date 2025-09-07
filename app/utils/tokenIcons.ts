import { stablecoins } from '@/data/stablecoins';

// Native token icons mapping
const NATIVE_TOKEN_ICONS: Record<number, string> = {
  1: '/eth-logo.svg',        // Ethereum
  56: '/bnb.svg',            // BNB Chain
  137: '/polygon.svg',       // Polygon
  42220: '/celo.svg',      // Celo
  42161: '/arbitrum.svg', // Arbitrum
  8453: '/base.svg', // Base
  10: '/optimism.svg', // Optimism
  534352: '/scroll.svg', // Scroll
};

export const getTokenIcon = (symbol: string, chainId?: number): string => {
  // Check if it's a native token
  if (symbol === 'ETH' || symbol === 'MATIC' || symbol === 'BNB' || symbol === 'CELO') {
    return chainId ? (NATIVE_TOKEN_ICONS[chainId] || '/default-token.svg') : '/default-token.svg';
  }
  
  // Check stablecoins
  const stablecoin = stablecoins.find(sc => sc.baseToken === symbol);
  if (stablecoin?.flag) {
    return stablecoin.flag;
  }
  
  // Default fallback
  return '/default-token.svg';
};

export const getNativeTokenIcon = (chainId: number): string => {
  return NATIVE_TOKEN_ICONS[chainId] || '/default-token.svg';
};
