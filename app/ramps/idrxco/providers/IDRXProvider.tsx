'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useBalance } from '../hooks/useBalance';
import { useTransaction } from '../hooks/useTransaction';
import { useIDRXRedeem } from '../hooks/useIDRXRedeem';
import { SUPPORTED_CHAINS_NORMAL, DEFAULT_CHAIN, type ChainConfig } from '../utils/chains';
import { DEFAULT_TOKEN, type TokenSymbol } from '../utils/tokens';

interface IDRXContextType {
  // Authentication
  isAuthenticated: boolean;
  
  // Wallet info
  walletAddress: string | undefined;
  isConnected: boolean;
  
  // Balance hooks factory
  useBalanceHook: (chain: ChainConfig, token: TokenSymbol, address?: string) => ReturnType<typeof useBalance>;
  
  // Transaction hooks factory
  useTransactionHook: () => ReturnType<typeof useTransaction>;
  
  // Redeem hooks factory
  useRedeemHook: (chain: ChainConfig, address?: string) => ReturnType<typeof useIDRXRedeem>;
  
  // Chain utilities
  supportedChains: ChainConfig[];
  defaultChain: ChainConfig;
  defaultToken: TokenSymbol;
}

const IDRXContext = createContext<IDRXContextType | undefined>(undefined);

interface IDRXProviderProps {
  children: ReactNode;
}

/**
 * Modern IDRX Provider that replaces the old Web3Provider
 * Provides clean access to all IDRX-related functionality using modern patterns
 */
export function IDRXProvider({ children }: IDRXProviderProps) {
  const { authenticated } = usePrivy();
  const { walletAddress, isConnected } = useTransaction();

  // Hook factories to avoid hook call issues
  const useBalanceHook = (chain: ChainConfig, token: TokenSymbol, address?: string) => 
    useBalance(chain, token, address);
  
  const useTransactionHook = () => useTransaction();
  
  const useRedeemHook = (chain: ChainConfig, address?: string) => 
    useIDRXRedeem(chain, address);

  const contextValue: IDRXContextType = {
    // Authentication
    isAuthenticated: authenticated,
    
    // Wallet info
    walletAddress,
    isConnected,
    
    // Hook factories
    useBalanceHook,
    useTransactionHook,
    useRedeemHook,
    
    // Chain utilities
    supportedChains: SUPPORTED_CHAINS_NORMAL,
    defaultChain: DEFAULT_CHAIN,
    defaultToken: DEFAULT_TOKEN,
  };

  return (
    <IDRXContext.Provider value={contextValue}>
      {children}
    </IDRXContext.Provider>
  );
}

/**
 * Hook to access IDRX context
 * Provides type-safe access to all IDRX functionality
 */
export function useIDRX() {
  const context = useContext(IDRXContext);
  if (context === undefined) {
    throw new Error('useIDRX must be used within an IDRXProvider');
  }
  return context;
}

/**
 * Higher-order component for IDRX functionality
 * Can be used to wrap components that need IDRX access
 */
export function withIDRX<P extends object>(Component: React.ComponentType<P>) {
  return function IDRXWrappedComponent(props: P) {
    return (
      <IDRXProvider>
        <Component {...props} />
      </IDRXProvider>
    );
  };
}
