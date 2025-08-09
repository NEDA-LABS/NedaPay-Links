'use client';

import { useEffect, useState, useRef } from 'react';
import { ethers } from 'ethers';
import { ChainConfig } from './constants';
import { TOKEN_ADDRESSES, TOKEN_ABI, TOKEN_DECIMALS } from './tokenConfig';

type TokenSymbol = keyof typeof TOKEN_ADDRESSES;
type ChainId = keyof typeof TOKEN_ADDRESSES[TokenSymbol];

type Balances = Record<number, Record<string, string>>;

const CACHE_DURATION = 30_000; // ms

export const useBalances = (chains: ChainConfig[], userAddress: string) => {
  const [balances, setBalances] = useState<Balances>({});
  const [loading, setLoading] = useState(true);

  // simple in-memory cache
  const cache = useRef<Record<string, { data: Balances; ts: number }>>({});

  useEffect(() => {
    if (!userAddress) {
      setBalances({});
      setLoading(false);
      return;
    }

    const run = async () => {
      const cacheKey = `${userAddress}-${chains.map(c => c.id).join('-')}`;
      const cached = cache.current[cacheKey];
      if (cached && Date.now() - cached.ts < CACHE_DURATION) {
        setBalances(cached.data);
        setLoading(false);
        return;
      }

      setLoading(true);

      // 1️⃣  build all promises up-front
      const promises = chains.flatMap(chain =>
        chain.tokens.map(async token => {
          const addr = (TOKEN_ADDRESSES as any)[token]?.[chain.id];
          if (!addr) return { chainId: chain.id, token, balance: '0' };

          try {
            const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);
            const contract = new ethers.Contract(addr, TOKEN_ABI, provider);
            const [decimals, raw] = await Promise.all([
              TOKEN_DECIMALS[token as keyof typeof TOKEN_DECIMALS] ||
                contract.decimals(),
              contract.balanceOf(userAddress),
            ]);
            if(chain.id === 56 && token === 'USDT'){
              return { chainId: chain.id, token, balance: ethers.utils.formatUnits(raw, 18) };
            }
            return { chainId: chain.id, token, balance: ethers.utils.formatUnits(raw, decimals) };
          } catch {
            return { chainId: chain.id, token, balance: '0' };
          }
        })
      );

      // parallel
      const results = await Promise.all(promises);

      // group
      const grouped: Balances = {};
      results.forEach(({ chainId, token, balance }) => {
        grouped[chainId] ??= {};
        grouped[chainId][token] = balance;
      });

      setBalances(grouped);
      cache.current[cacheKey] = { data: grouped, ts: Date.now() };
      setLoading(false);
    };

    run();
  }, [chains, userAddress]);

  return { balances, loading };
};