import { createAcrossClient } from '@across-protocol/app-sdk';
import { mainnet, optimism, arbitrum } from 'viem/chains';

export const acrossClient = createAcrossClient({
  integratorId: process.env.NEXT_PUBLIC_ACROSS_INTEGRATOR_ID! as `0x${string}`,
  chains: [mainnet, optimism, arbitrum],
});