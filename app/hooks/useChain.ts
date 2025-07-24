import { useState, useEffect, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { 
  ChainId, 
  ChainConfig, 
  SUPPORTED_CHAINS, 
  DEFAULT_CHAIN,
  BASE_CHAIN,
  ARBITRUM_CHAIN,
  POLYGON_CHAIN,
  CELO_CHAIN,
  BNB_CHAIN
} from '@/offramp/offrampHooks/constants';

interface UseChainReturn {
  currentChain: ChainConfig;
  currentChainId: ChainId;
  supportedChains: ChainConfig[];
  isChainSupported: (chainId: number) => boolean;
  switchChain: (chainId: ChainId) => Promise<boolean>;
  getChainById: (chainId: ChainId) => ChainConfig | undefined;
  isConnected: boolean;
  isSwitching: boolean;
  error: string | null;
}

// Create a map for quick chain lookup
const chainMap = new Map<ChainId, ChainConfig>(
  SUPPORTED_CHAINS.map(chain => [chain.id, chain])
);

export const useChain = (): UseChainReturn => {
  const { wallets } = useWallets();
  const [currentChain, setCurrentChain] = useState<ChainConfig>(DEFAULT_CHAIN);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the active wallet (embedded or EOA)
  const activeWallet = wallets.find(wallet => wallet.connectorType === 'embedded') || wallets[0];

  // Check if user is connected to any wallet
  const isConnected = wallets.length > 0 && activeWallet !== undefined;

  // Get current chain from wallet
  useEffect(() => {
    const getCurrentChain = async () => {
      if (!activeWallet) {
        setCurrentChain(DEFAULT_CHAIN);
        return;
      }

      try {
        // Get chain ID from the active wallet
        const chainId = await activeWallet.chainId;
        
        // Convert string chain ID to number and ensure it's one of our supported ChainId values
        const numericChainId = Number(chainId) as ChainId;
        
        // Find the chain config for the current chain ID
        const chain = chainMap.get(numericChainId);
        
        if (chain) {
          setCurrentChain(chain);
        } else {
          // If current chain is not supported, default to BASE_CHAIN
          console.warn(`Unsupported chain ID: ${chainId}. Switching to default chain.`);
          setCurrentChain(DEFAULT_CHAIN);
        }
      } catch (err) {
        console.error('Error getting current chain:', err);
        setCurrentChain(DEFAULT_CHAIN);
        setError('Failed to get current chain');
      }
    };

    getCurrentChain();
  }, [activeWallet]);

  // Listen for chain changes
  useEffect(() => {
    if (!activeWallet) return;

    const handleChainChanged = (chainId: string) => {
      const numericChainId = parseInt(chainId, 16);
      const chain = chainMap.get(numericChainId as ChainId);
      
      if (chain) {
        setCurrentChain(chain);
        setError(null);
      } else {
        setError(`Unsupported chain: ${numericChainId}`);
      }
    };

    // Listen for chain changes (this depends on your wallet provider setup)
    // You might need to adjust this based on how Privy exposes chain change events
    if (typeof window !== 'undefined' && window.ethereum) {
      (window.ethereum as any).on('chainChanged', handleChainChanged);
      
      return () => {
        (window.ethereum as any).removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [activeWallet]);

  // Check if a chain ID is supported
  const isChainSupported = useCallback((chainId: number): boolean => {
    return chainMap.has(chainId as ChainId);
  }, []);

  // Get chain config by ID
  const getChainById = useCallback((chainId: ChainId): ChainConfig | undefined => {
    return chainMap.get(chainId);
  }, []);

  // Switch to a different chain
  const switchChain = useCallback(async (chainId: ChainId): Promise<boolean> => {
    if (!activeWallet) {
      setError('No wallet connected');
      return false;
    }

    if (!isChainSupported(chainId)) {
      setError(`Chain ID ${chainId} is not supported`);
      return false;
    }

    // If already on the requested chain, return true
    if (currentChain.id === chainId) {
      return true;
    }

    setIsSwitching(true);
    setError(null);

    try {
      // Switch chain using Privy wallet
      await activeWallet.switchChain(chainId);
      
      // Update current chain state
      const newChain = chainMap.get(chainId);
      if (newChain) {
        setCurrentChain(newChain);
      }
      
      setIsSwitching(false);
      return true;
    } catch (err: any) {
      console.error('Error switching chain:', err);
      
      // Handle specific error cases
      if (err.code === 4902) {
        // Chain not added to wallet, try to add it
        try {
          const chainConfig = chainMap.get(chainId);
          if (chainConfig) {
            await activeWallet.switchChain(chainId);
            setCurrentChain(chainConfig);
            setIsSwitching(false);
            return true;
          }
        } catch (addErr) {
          console.error('Error adding chain:', addErr);
          setError('Failed to add chain to wallet');
        }
      } else if (err.code === 4001) {
        setError('User rejected the request');
      } else {
        setError('Failed to switch chain');
      }
      
      setIsSwitching(false);
      return false;
    }
  }, [activeWallet, currentChain.id, isChainSupported]);

  return {
    currentChain,
    currentChainId: currentChain.id,
    supportedChains: SUPPORTED_CHAINS,
    isChainSupported,
    switchChain,
    getChainById,
    isConnected,
    isSwitching,
    error,
  };
};