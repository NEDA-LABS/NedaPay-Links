// app/idrxco/utils/tokens.ts
// Token configs for IDRXCO flows (USDT, USDC) on Base, Polygon, BNB

import type { ChainId } from './chains';
import { IDRX_CONTRACT_ADDRESSES } from './chains';

export type TokenSymbol = 'USDT' | 'USDC' | 'IDRX';

export interface TokenInfo {
  symbol: TokenSymbol;
  name: string;
  decimals: number;
  icon: string; // path under /public
  addresses: Partial<Record<ChainId, string>>; // per-chain token contract
}

export const TOKENS: TokenInfo[] = [
  {
    symbol: 'IDRX',
    name: 'Indonesian Rupiah eXpress',
    decimals: 18,
    icon: '/idrx-coin.png',
    addresses: {
      8453: IDRX_CONTRACT_ADDRESSES[8453],
      137: IDRX_CONTRACT_ADDRESSES[137],
      56:  IDRX_CONTRACT_ADDRESSES[56],
    },
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '/usdt-icon.png',
    addresses: {
        137:   '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon 
        56:    '0x55d398326f99059fF775485246999027B3197955',  // BNB 
    },
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '/usdc-logo.svg',
    addresses: {
        8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base
    },
  },
];

export const DEFAULT_TOKEN: TokenSymbol = 'IDRX';
