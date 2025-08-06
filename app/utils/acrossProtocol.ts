import { createAcrossClient } from '@across-protocol/app-sdk';
import { optimism, arbitrum, base, scroll, celo, polygon, bsc } from 'viem/chains';

export const acrossClient = createAcrossClient({
  integratorId: process.env.NEXT_PUBLIC_ACROSS_INTEGRATOR_ID! as `0x${string}`,
  chains: [optimism, arbitrum, base, scroll, celo, polygon, bsc],
});