'use client';

import { useEffect, useState, useRef } from 'react';
import { createPublicClient, http, formatUnits, getAddress } from 'viem';
import { base, polygon, bsc } from 'viem/chains';
import type { ChainConfig } from '../utils/chains';
import type { TokenSymbol } from '../utils/tokens';
import { TOKENS } from '../utils/tokens';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

const CACHE_DURATION = 30_000; // 30 seconds

type CacheKey = string;
type BalanceCache = Record<CacheKey, { data: string; timestamp: number }>;

// Chain mapping for viem
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 8453: return base;
    case 137: return polygon;
    case 56: return bsc;
    default: return base;
  }
};

// Create public clients for each chain (singleton pattern)
const publicClients = new Map();

const getPublicClient = (chain: ChainConfig) => {
  if (!publicClients.has(chain.id)) {
    const viemChain = getViemChain(chain.id);
    const client = createPublicClient({
      chain: viemChain,
      transport: http(chain.rpcUrl),
    });
    publicClients.set(chain.id, client);
  }
  return publicClients.get(chain.id);
};

/**
 * Modern wagmi-style hook for fetching token balances using viem public clients
 * Implements caching, error handling, and efficient parallel requests
 */
export const useBalance = (
  chain: ChainConfig | undefined,
  token: TokenSymbol,
  address: string | undefined
) => {
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef<BalanceCache>({});

  const fetchBalance = async () => {
    if (!chain || !address) {
      setBalance('0');
      setIsLoading(false);
      return;
    }

    const tokenInfo = TOKENS.find(t => t.symbol === token);
    const tokenAddress = tokenInfo?.addresses?.[chain.id];
    const cacheKey: CacheKey = `${chain.id}-${token}-${address}`;

    // Check cache first
    const cached = cache.current[cacheKey];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setBalance(cached.data);
      setIsLoading(false);
      return;
    }

    if (!tokenAddress) {
      setBalance('0');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const publicClient = getPublicClient(chain);
      
      // Parallel requests for balance and decimals
      const [balanceResult, decimalsResult] = await Promise.all([
        publicClient.readContract({
          address: getAddress(tokenAddress),
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [getAddress(address)],
        }),
        publicClient.readContract({
          address: getAddress(tokenAddress),
          abi: ERC20_ABI,
          functionName: 'decimals',
        }).catch(() => tokenInfo?.decimals ?? 18), // Fallback to token config
      ]);

      const formattedBalance = formatUnits(balanceResult as bigint, decimalsResult as number);
      
      // Update cache
      cache.current[cacheKey] = {
        data: formattedBalance,
        timestamp: Date.now(),
      };

      setBalance(formattedBalance);
    } catch (err) {
      console.error(`Failed to fetch ${token} balance on ${chain.name}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
      setBalance('0');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [chain?.id, token, address]);

  const refetch = () => {
    if (chain && address) {
      const cacheKey: CacheKey = `${chain.id}-${token}-${address}`;
      delete cache.current[cacheKey];
    }
    fetchBalance();
  };

  return {
    balance,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching multiple token balances across chains
 * Optimized for parallel requests and caching
 */
export const useMultiChainBalance = (
  chains: ChainConfig[],
  tokens: TokenSymbol[],
  address: string | undefined
) => {
  const [balances, setBalances] = useState<Record<number, Record<TokenSymbol, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBalances = async () => {
    if (!address || chains.length === 0 || tokens.length === 0) {
      setBalances({});
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Create all balance fetch promises
      const promises = chains.flatMap(chain =>
        tokens.map(async (token) => {
          const tokenInfo = TOKENS.find(t => t.symbol === token);
          const tokenAddress = tokenInfo?.addresses?.[chain.id];
          
          if (!tokenAddress) {
            return { chainId: chain.id, token, balance: '0' };
          }

          try {
            const publicClient = getPublicClient(chain);
            
            const [balanceResult, decimalsResult] = await Promise.all([
              publicClient.readContract({
                address: getAddress(tokenAddress),
                abi: ERC20_ABI,
                functionName: 'balanceOf',
                args: [getAddress(address)],
              }),
              publicClient.readContract({
                address: getAddress(tokenAddress),
                abi: ERC20_ABI,
                functionName: 'decimals',
              }).catch(() => tokenInfo?.decimals ?? 18),
            ]);

            const formattedBalance = formatUnits(balanceResult as bigint, decimalsResult as number);
            return { chainId: chain.id, token, balance: formattedBalance };
          } catch (err) {
            console.error(`Failed to fetch ${token} balance on ${chain.name}:`, err);
            return { chainId: chain.id, token, balance: '0' };
          }
        })
      );

      // Execute all promises in parallel
      const results = await Promise.all(promises);

      // Group results by chain and token
      const groupedBalances: Record<number, Record<TokenSymbol, string>> = {};
      results.forEach(({ chainId, token, balance }) => {
        if (!groupedBalances[chainId]) {
          groupedBalances[chainId] = {} as Record<TokenSymbol, string>;
        }
        groupedBalances[chainId][token] = balance;
      });

      setBalances(groupedBalances);
    } catch (err) {
      console.error('Failed to fetch multi-chain balances:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balances');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBalances();
  }, [chains.length, tokens.length, address]);

  return {
    balances,
    isLoading,
    error,
    refetch: fetchAllBalances,
  };
};
