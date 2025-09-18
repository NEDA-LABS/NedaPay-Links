// app/idrxco/utils/useTokenBalance.ts
'use client';

import { useEffect, useRef, useState } from 'react';
import { ethers } from 'ethers';
import type { ChainConfig } from './chains';
import type { TokenSymbol } from './tokens';
import { TOKENS } from './tokens';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

const CACHE_DURATION = 30_000; // 30s

type CacheKey = string; // `${chainId}-${token}-${address}`

export const useTokenBalance = (
  chain: ChainConfig | undefined,
  token: TokenSymbol,
  address: string | undefined
) => {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState<boolean>(false);
  const cache = useRef<Record<CacheKey, { ts: number; value: string }>>({});

  useEffect(() => {
    const run = async () => {
      if (!chain || !address) {
        setBalance('0');
        setLoading(false);
        return;
      }
      const tokenInfo = TOKENS.find(t => t.symbol === token);
      const tokenAddr = tokenInfo?.addresses?.[chain.id];
      const key: CacheKey = `${chain.id}-${token}-${address}`;

      // Serve from cache if fresh
      const cached = cache.current[key];
      if (cached && Date.now() - cached.ts < CACHE_DURATION) {
        setBalance(cached.value);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (!tokenAddr) {
          setBalance('0');
          setLoading(false);
          return;
        }
        const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);
        const contract = new ethers.Contract(tokenAddr, ERC20_ABI, provider);
        const [dec, raw] = await Promise.all([
          contract.decimals().catch(() => tokenInfo?.decimals ?? 18),
          contract.balanceOf(address),
        ]);
        const formatted = ethers.utils.formatUnits(raw, dec);
        setBalance(formatted);
        cache.current[key] = { ts: Date.now(), value: formatted };
      } catch (e) {
        setBalance('0');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [chain?.id, chain?.rpcUrl, token, address]);

  const refetch = () => {
    // Invalidate cache and re-run
    if (chain && address) {
      const key: CacheKey = `${chain.id}-${token}-${address}`;
      delete cache.current[key];
    }
    // trigger effect by updating a dep could be done differently; for simplicity, call run again by toggling states
    setLoading(l => !l);
  };

  return { balance, loading, refetch };
};
