'use client';

import { useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, createPublicClient, custom, http, formatUnits, parseUnits, getAddress } from 'viem';
import { base, polygon, bsc } from 'viem/chains';
import type { ChainConfig } from '../utils/chains';
import type { TokenSymbol } from '../utils/tokens';
import { TOKENS } from '../utils/tokens';
import { IDRX_CONTRACT_ADDRESSES } from '../utils/chains';
import crypto from 'crypto';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const IDRX_ABI = [
  {
    name: 'burnWithAccountNumber',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'hashedAccountNumber', type: 'string' },
    ],
    outputs: [],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Chain mapping for viem
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 8453: return base;
    case 137: return polygon;
    case 56: return bsc;
    default: return base;
  }
};

interface TransactionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  success: boolean;
}

interface BurnTransactionParams {
  amount: string;
  bankAccountNumber: string;
  bankName: string;
  chain: ChainConfig;
}

interface TransferTransactionParams {
  amount: string;
  to: string;
  token: TokenSymbol;
  chain: ChainConfig;
}

/**
 * Modern hook for handling IDRX transactions using Privy and viem
 * Provides secure, efficient transaction handling with proper error management
 */
export const useTransaction = () => {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [state, setState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    txHash: null,
    success: false,
  });

  const activeWallet = wallets?.[0];

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      txHash: null,
      success: false,
    });
  }, []);

  const getWalletClient = useCallback(async (chain: ChainConfig) => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    // Switch to the correct chain first
    try {
      await activeWallet.switchChain(chain.id);
    } catch (error) {
      console.warn('Chain switch failed, continuing with current chain:', error);
    }

    const ethereumProvider = await activeWallet.getEthereumProvider();
    if (!ethereumProvider) {
      throw new Error('Failed to get Ethereum provider');
    }

    const viemChain = getViemChain(chain.id);
    return createWalletClient({
      chain: viemChain,
      transport: custom(ethereumProvider),
    });
  }, [activeWallet]);

  const getPublicClient = useCallback((chain: ChainConfig) => {
    const viemChain = getViemChain(chain.id);
    return createPublicClient({
      chain: viemChain,
      transport: http(),
    });
  }, []);

  /**
   * Burn IDRX tokens for redemption
   * Uses secure hashing for bank account information
   */
  const burnIDRX = useCallback(async ({
    amount,
    bankAccountNumber,
    bankName,
    chain,
  }: BurnTransactionParams) => {
    if (!authenticated || !activeWallet) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const walletClient = await getWalletClient(chain);
      const [account] = await walletClient.getAddresses();
      
      if (!account) {
        throw new Error('No account available');
      }

      const idrxAddress = IDRX_CONTRACT_ADDRESSES[chain.id];
      if (!idrxAddress) {
        throw new Error(`IDRX not supported on ${chain.name}`);
      }

      // Create secure hash of bank account information
      const accountIdentifier = `${bankName}_${bankAccountNumber}`;
      const hashedAccountNumber = crypto
        .createHash('sha256')
        .update(accountIdentifier)
        .digest('hex');

      // Parse amount to wei (IDRX uses 18 decimals)
      const amountInWei = parseUnits(amount, 18);

      // Check balance before transaction
      const publicClient = getPublicClient(chain);
      const balance = await publicClient.readContract({
        address: getAddress(idrxAddress),
        abi: IDRX_ABI,
        functionName: 'balanceOf',
        args: [account],
      });

      if (balance < amountInWei) {
        throw new Error('Insufficient IDRX balance');
      }

      // Execute burn transaction
      const txHash = await walletClient.writeContract({
        address: getAddress(idrxAddress),
        abi: IDRX_ABI,
        functionName: 'burnWithAccountNumber',
        args: [amountInWei, hashedAccountNumber],
        account,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        txHash,
        success: true,
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        success: false,
      }));
      throw error;
    }
  }, [authenticated, activeWallet, getWalletClient]);

  /**
   * Transfer ERC20 tokens
   * Generic function for token transfers
   */
  const transferToken = useCallback(async ({
    amount,
    to,
    token,
    chain,
  }: TransferTransactionParams) => {
    if (!authenticated || !activeWallet) {
      throw new Error('Wallet not connected');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const walletClient = await getWalletClient(chain);
      const [account] = await walletClient.getAddresses();
      
      if (!account) {
        throw new Error('No account available');
      }

      const tokenInfo = TOKENS.find(t => t.symbol === token);
      const tokenAddress = tokenInfo?.addresses?.[chain.id];
      
      if (!tokenAddress) {
        throw new Error(`${token} not supported on ${chain.name}`);
      }

      // Parse amount with correct decimals
      const amountInWei = parseUnits(amount, tokenInfo.decimals);

      // Check balance before transaction
      const publicClient = getPublicClient(chain);
      const balance = await publicClient.readContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [account],
      });

      if (balance < amountInWei) {
        throw new Error(`Insufficient ${token} balance`);
      }

      // Execute transfer
      const txHash = await walletClient.writeContract({
        address: getAddress(tokenAddress),
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [getAddress(to), amountInWei],
        account,
      });

      setState(prev => ({
        ...prev,
        isLoading: false,
        txHash,
        success: true,
      }));

      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transfer failed';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        success: false,
      }));
      throw error;
    }
  }, [authenticated, activeWallet, getWalletClient]);

  /**
   * Get user's wallet address
   */
  const getWalletAddress = useCallback(async (): Promise<string> => {
    if (!activeWallet) {
      throw new Error('No wallet connected');
    }

    const ethereumProvider = await activeWallet.getEthereumProvider();
    if (!ethereumProvider) {
      throw new Error('Failed to get Ethereum provider');
    }

    // Get address from the wallet
    return activeWallet.address;
  }, [activeWallet]);

  /**
   * Estimate gas for a transaction
   */
  const estimateGas = useCallback(async (
    chain: ChainConfig,
    contractAddress: string,
    abi: any,
    functionName: string,
    args: any[]
  ) => {
    try {
      const publicClient = getPublicClient(chain);
      const walletClient = await getWalletClient(chain);
      const [account] = await walletClient.getAddresses();
      
      if (!account) {
        throw new Error('No account available');
      }

      const gasEstimate = await publicClient.estimateContractGas({
        address: getAddress(contractAddress),
        abi,
        functionName,
        args,
        account,
      });

      return gasEstimate;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      return BigInt(100000); // Fallback gas estimate
    }
  }, [getWalletClient, getPublicClient]);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    txHash: state.txHash,
    success: state.success,
    
    // Actions
    burnIDRX,
    transferToken,
    getWalletAddress,
    estimateGas,
    resetState,
    
    // Wallet info
    isConnected: authenticated && !!activeWallet,
    walletAddress: activeWallet?.address,
  };
};
