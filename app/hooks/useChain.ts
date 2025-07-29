import { useState, useEffect, useCallback } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { ChainConfig, SUPPORTED_CHAINS, DEFAULT_CHAIN } from '@/offramp/offrampHooks/constants';

interface UseChainReturn {
  currentChain: ChainConfig;
  supportedChains: ChainConfig[];
  switchChain: (chainId: number) => Promise<void>;
  isConnected: boolean;
  isSwitching: boolean;
  isInitializing: boolean;
  error: string | null;
  clearError: () => void;
}

export const useChain = (): UseChainReturn => {
  const { wallets } = useWallets();
  const [currentChain, setCurrentChain] = useState<ChainConfig>(DEFAULT_CHAIN);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const wallet = wallets[0];
  const isConnected = Boolean(wallet);

  useEffect(() => {
    if (!wallet) {
      setCurrentChain(DEFAULT_CHAIN);
      setIsInitializing(false);
      return;
    }
    
    // Only update if chainId is defined and valid
    if (wallet.chainId) {
      const chainId = Number(wallet.chainId);
      const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
      if (chain) {
        setCurrentChain(chain);
        setIsInitializing(false);
        return;
      }
    }
    
    // Fallback to DEFAULT_CHAIN only if wallet exists but chain is unsupported
    setCurrentChain(DEFAULT_CHAIN);
    setIsInitializing(false);
  }, [wallet, wallet?.chainId]);

  const switchChain = useCallback(async (chainId: number) => {
    if (!wallet) {
      setError('Wallet not connected');
      return;
    }

    setIsSwitching(true);
    setError(null);

    try {
      await wallet.switchChain(chainId);
      console.log('Switching chain initiated');
    } catch (err: any) {
      setError(err.message.includes('rejected') 
        ? 'User rejected chain switch' 
        : `Failed to switch: ${err.message}`
      );
      console.error("Error switching chain:", err);
    } finally {
      setIsSwitching(false);
    }
  }, [wallet]);

  const clearError = useCallback(() => setError(null), []);

  return {
    currentChain,
    supportedChains: SUPPORTED_CHAINS,
    switchChain,
    isConnected,
    isSwitching,
    isInitializing,
    error,
    clearError,
  };
};