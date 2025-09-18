'use client';

import { useState, useCallback } from 'react';
import { useTransaction } from './useTransaction';
import { useBalance } from './useBalance';
import type { ChainConfig } from '../utils/chains';

interface BankAccount {
  id: number;
  bankAccountNumber: string;
  bankAccountName: string;
  bankCode: string;
  bankName: string;
}

interface RedeemParams {
  amount: string;
  bankAccount: BankAccount;
  chain: ChainConfig;
}

interface RedeemState {
  isProcessing: boolean;
  error: string | null;
  success: boolean;
  txHash: string | null;
  step: 'idle' | 'burning' | 'submitting' | 'completed';
}

/**
 * Specialized hook for IDRX redemption process
 * Handles the complete flow: burn IDRX -> submit to backend -> track status
 */
export const useIDRXRedeem = (chain: ChainConfig, userAddress: string | undefined) => {
  const [state, setState] = useState<RedeemState>({
    isProcessing: false,
    error: null,
    success: false,
    txHash: null,
    step: 'idle',
  });

  const { burnIDRX, isLoading: txLoading, error: txError } = useTransaction();
  const { balance, refetch: refetchBalance } = useBalance(chain, 'IDRX', userAddress);

  const resetState = useCallback(() => {
    setState({
      isProcessing: false,
      error: null,
      success: false,
      txHash: null,
      step: 'idle',
    });
  }, []);

  /**
   * Execute complete redemption process
   */
  const executeRedeem = useCallback(async ({ amount, bankAccount, chain }: RedeemParams) => {
    if (!userAddress) {
      throw new Error('User address not available');
    }

    setState(prev => ({
      ...prev,
      isProcessing: true,
      error: null,
      step: 'burning',
    }));

    try {
      // Step 1: Burn IDRX tokens
      const txHash = await burnIDRX({
        amount,
        bankAccountNumber: bankAccount.bankAccountNumber,
        bankName: bankAccount.bankName,
        chain,
      });

      setState(prev => ({
        ...prev,
        txHash,
        step: 'submitting',
      }));

      // Step 2: Submit redemption request to backend
      const payload = {
        amount,
        bankAccount: bankAccount.bankAccountNumber,
        bankCode: bankAccount.bankCode,
        bankName: bankAccount.bankName,
        walletAddress: userAddress,
        txHash,
        chainId: chain.id,
        chainName: chain.name,
      };

      const response = await fetch('/api/idrxco/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process redemption request');
      }

      const result = await response.json();

      // Step 3: Complete process
      setState(prev => ({
        ...prev,
        isProcessing: false,
        success: true,
        step: 'completed',
      }));

      // Refresh balance after successful redemption
      refetchBalance();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Redemption failed';
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
        step: 'idle',
      }));
      throw error;
    }
  }, [userAddress, burnIDRX, refetchBalance]);

  /**
   * Validate redemption parameters
   */
  const validateRedemption = useCallback((amount: string): string | null => {
    if (!amount || parseFloat(amount) <= 0) {
      return 'Amount must be greater than 0';
    }

    if (!balance || parseFloat(balance) === 0) {
      return 'Insufficient IDRX balance';
    }

    if (parseFloat(amount) > parseFloat(balance)) {
      return 'Amount exceeds available balance';
    }

    return null;
  }, [balance]);

  /**
   * Get redemption fee estimate
   */
  const getRedemptionFee = useCallback((amount: string): string => {
    // Assuming 0.5% fee for redemption
    const fee = parseFloat(amount) * 0.005;
    return fee.toFixed(6);
  }, []);

  /**
   * Calculate net amount after fees
   */
  const getNetAmount = useCallback((amount: string): string => {
    const fee = parseFloat(getRedemptionFee(amount));
    const net = parseFloat(amount) - fee;
    return Math.max(0, net).toFixed(6);
  }, [getRedemptionFee]);

  return {
    // State
    isProcessing: state.isProcessing || txLoading,
    error: state.error || txError,
    success: state.success,
    txHash: state.txHash,
    step: state.step,
    
    // Balance info
    balance,
    refetchBalance,
    
    // Actions
    executeRedeem,
    validateRedemption,
    resetState,
    
    // Calculations
    getRedemptionFee,
    getNetAmount,
  };
};
