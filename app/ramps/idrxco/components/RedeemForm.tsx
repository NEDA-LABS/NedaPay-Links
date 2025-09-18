// app/components/redeem/redeem-form.tsx
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Info, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { AddRecipientModal } from './AddRecipientModal';
import { useWallets } from '@privy-io/react-auth';
import { SUPPORTED_CHAINS_NORMAL, type ChainConfig } from '@/ramps/idrxco/utils/chains';
import { Badge } from '@/components/ui/badge';
import { useBalance } from '@/ramps/idrxco/hooks/useBalance';
import { useIDRXRedeem } from '@/ramps/idrxco/hooks/useIDRXRedeem';
import { useTransaction } from '@/ramps/idrxco/hooks/useTransaction';
import { useRates } from '@/ramps/idrxco/hooks/useRates';
import { TOKENS, DEFAULT_TOKEN, type TokenSymbol } from '@/ramps/idrxco/utils/tokens';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const redeemSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  bankAccountId: z.string().min(1, 'Please select a bank account'),
});

type RedeemFormData = z.infer<typeof redeemSchema>;

interface BankAccount {
  id: number;
  bankAccountNumber: string;
  bankAccountName: string;
  bankCode: string;
  bankName: string;
}

export function RedeemForm() {
  const { toast } = useToast();
  const { wallets } = useWallets();
  const queryClient = useQueryClient();
  const [selectedChain, setSelectedChain] = useState<ChainConfig>(() => SUPPORTED_CHAINS_NORMAL.find(c => c.id === 56) || SUPPORTED_CHAINS_NORMAL[0]);
  const [selectedToken, setSelectedToken] = useState<TokenSymbol>(DEFAULT_TOKEN);

  // Filter tokens based on selected chain
  const supportedTokens = TOKENS.filter(token => 
    token.addresses && token.addresses[selectedChain.id]
  );

  // Get wallet address
  const { walletAddress, isConnected } = useTransaction();
  
  // Form setup - moved up to make watch available
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
  });

  // Modern balance hook
  const { balance: tokenBalance, isLoading: isLoadingTokenBalance, refetch: refetchTokenBalance } = useBalance(
    selectedChain,
    selectedToken,
    walletAddress
  );

  // Rates hook for dynamic exchange rates
  const { rate, isLoading: isLoadingRates, error: ratesError } = useRates({
    chain: selectedChain,
    token: selectedToken,
    amount: watch('amount'),
  });

  // Redemption hook
  const {
    isProcessing,
    error: redeemError,
    success: redeemSuccess,
    txHash,
    step,
    executeRedeem,
    validateRedemption,
    resetState,
    getRedemptionFee,
    getNetAmount,
  } = useIDRXRedeem(selectedChain, walletAddress);

  const { data: bankAccounts = [], isLoading: isLoadingAccounts } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/idrxco/bank-accounts');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const result = await response.json();
      return result.data ?? result;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (data: RedeemFormData) => {
      const selectedAccount = bankAccounts.find((account) => account.id === parseInt(data.bankAccountId));
      if (!selectedAccount) throw new Error('Selected bank account not found');
      if (!isConnected) throw new Error('Wallet not connected');

      // Validate redemption
      const validationError = validateRedemption(data.amount);
      if (validationError) throw new Error(validationError);

      // Execute redemption using modern hook
      return await executeRedeem({
        amount: data.amount,
        bankAccount: selectedAccount,
        chain: selectedChain,
      });
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Redeem request submitted successfully. You will receive IDR in your bank account within 24 hours.' });
      setValue('amount', '');
      setValue('bankAccountId', '');
      resetState();
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.message || 'Failed to process redeem request.', variant: 'destructive' });
    },
  });

  const onSubmit = (form: RedeemFormData) => {
    redeemMutation.mutate(form);
  };

  // Chain switching support (Privy embedded/external + window.ethereum fallback)
  const switchToChain = async (chain: ChainConfig) => {
    try {
      if (wallets && wallets[0] && typeof wallets[0].switchChain === 'function') {
        await wallets[0].switchChain(chain.id);
      } else if (typeof window !== 'undefined' && (window as any).ethereum?.request) {
        const provider = (window as any).ethereum;
        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chain.chainIdHex }],
          });
        } catch (switchError: any) {
          // If the chain is not added to MetaMask, try to add it
          if (switchError?.code === 4902 || /Unrecognized chain ID/i.test(switchError?.message || '')) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: chain.chainIdHex,
                chainName: chain.name,
                nativeCurrency: chain.nativeCurrency,
                rpcUrls: chain.rpcUrls,
                blockExplorerUrls: chain.blockExplorerUrls,
              }],
            });
          } else {
            throw switchError;
          }
        }
      }
      setSelectedChain(chain);
      
      // Check if current token is supported on new chain, if not switch to first available
      const newChainTokens = TOKENS.filter(token => 
        token.addresses && token.addresses[chain.id]
      );
      
      if (newChainTokens.length > 0 && !newChainTokens.some(token => token.symbol === selectedToken)) {
        setSelectedToken(newChainTokens[0].symbol);
      }
      
      toast({ title: 'Network switched', description: `Active network: ${chain.name}` });
    } catch (e: any) {
      toast({ title: 'Network switch failed', description: e?.message || 'Unable to switch network', variant: 'destructive' });
    }
  };

  const handleAddRecipientSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
  };

  const handleMaxAmount = () => {
    if (tokenBalance && parseFloat(tokenBalance) > 0) {
      // Set max amount minus estimated fee
      const fee = getRedemptionFee(tokenBalance);
      const maxRedeemable = Math.max(0, parseFloat(tokenBalance) - parseFloat(fee));
      setValue('amount', maxRedeemable.toString());
    }
  };

  // Ensure selected token is supported on current chain
  useEffect(() => {
    if (supportedTokens.length > 0 && !supportedTokens.some(token => token.symbol === selectedToken)) {
      setSelectedToken(supportedTokens[0].symbol);
    }
  }, [selectedChain.id, supportedTokens, selectedToken]);

  // Show transaction status
  useEffect(() => {
    if (redeemError) {
      toast({ 
        title: 'Transaction Error', 
        description: redeemError, 
        variant: 'destructive' 
      });
    }
    if (redeemSuccess && txHash) {
      toast({ 
        title: 'Transaction Successful!', 
        description: `Transaction hash: ${txHash.slice(0, 10)}...` 
      });
    }
  }, [redeemError, redeemSuccess, txHash, toast]);

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl border border-slate-800 bg-slate-800 shadow-xl p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Redeem</h1>
        <Info className="h-5 w-5 text-slate-400" />
      </div>

      {/* Network + wallet summary */}
      <div className="space-y-3 mb-6">
        <div>
          <Label htmlFor="network" className="text-sm font-medium text-slate-300">Network</Label>
          <Select
            onValueChange={(value) => {
              const chain = SUPPORTED_CHAINS_NORMAL.find(c => c.id.toString() === value) || selectedChain;
              switchToChain(chain);
            }}
            value={selectedChain.id.toString()}
          >
            <SelectTrigger className="w-full py-6 rounded-lg bg-slate-200 border border-indigo-700 text-slate-800">
              <SelectValue placeholder="Select network" />
            </SelectTrigger>
            <SelectContent className="bg-slate-200 text-slate-800 border border-indigo-700">
              {SUPPORTED_CHAINS_NORMAL.map((chain) => (
                <SelectItem key={chain.id} value={chain.id.toString()}>
                  <span className="flex items-center gap-2">
                    <Image src={chain.icon} alt={chain.name} width={18} height={18} className="rounded-full bg-white" />
                    {chain.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-indigo-400 flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-indigo-300">Active:</span> {selectedChain.name}
          {walletAddress && (
            <Badge variant="secondary" className="bg-indigo-800 text-indigo-100 border border-indigo-600">
              {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
            </Badge>
          )}
        </div>
        {!SUPPORTED_CHAINS_NORMAL.some(c => c.id === selectedChain.id) && (
          <p className="text-xs text-purple-300 bg-purple-950/40 border border-purple-700/50 rounded-md p-2">
            To redeem IDRX, please switch to a supported network.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="amount" className="text-sm font-medium text-slate-300">You will redeem</Label>
            <div className="text-sm text-slate-400">
              <span className="font-medium text-slate-200">
                {isLoadingTokenBalance ? '...' : parseFloat(tokenBalance || '0').toLocaleString('id-ID')} {selectedToken}
              </span>
              <Button 
                variant="link" 
                type="button" 
                onClick={handleMaxAmount} 
                className="h-auto p-0 ml-2 text-sm font-semibold text-indigo-300"
                disabled={isLoadingTokenBalance || !tokenBalance || parseFloat(tokenBalance) === 0}
              >
                Max
              </Button>
            </div>
          </div>
          <div className="relative">
            <Input id="amount" type="number" placeholder="Amount" className="w-full pl-4 pr-32 py-6 rounded-lg bg-slate-100 border border-slate-300 text-black placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500" {...register('amount')} />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="flex items-center space-x-2 bg-slate-200 px-3 py-1 rounded-full text-slate-800 border border-slate-300 hover:bg-slate-300">
                    <Image src={(TOKENS.find(t => t.symbol === selectedToken)?.icon) || '/usdt-icon.png'} alt={selectedToken} width={18} height={18} className="rounded-full bg-white" />
                    <span className="font-semibold">{selectedToken} on {selectedChain.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="bg-white text-slate-900">
                  {supportedTokens.length > 0 ? (
                    supportedTokens.map((t) => (
                      <DropdownMenuItem key={t.symbol} onClick={() => setSelectedToken(t.symbol)} className="cursor-pointer">
                        <span className="flex items-center gap-2">
                          <Image src={t.icon} alt={t.name} width={18} height={18} />
                          {t.symbol}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled className="text-slate-500">
                      No tokens supported on {selectedChain.name}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>}
        </div>

        <div>
          <Label htmlFor="receiveAmount" className="text-sm font-medium text-slate-300">You will receive</Label>
          <div className="relative mt-1">
            <Input 
              id="receiveAmount" 
              type="number" 
              placeholder="Amount" 
              className="w-full pl-4 pr-24 py-6 rounded-lg bg-slate-100 border border-slate-300 text-black" 
              value={watch('amount') ? (parseFloat(watch('amount')) * rate).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : ''} 
              readOnly 
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-slate-800">IDR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-slate-400">
            Exchange rate: 
            <span className="font-medium text-slate-200">
              {isLoadingRates ? (
                ' Loading...'
              ) : ratesError ? (
                ' Rate unavailable'
              ) : (
                ` 1 ${selectedToken} = ${rate.toLocaleString('id-ID')} IDR`
              )}
            </span>
          </div>
          {watch('amount') && parseFloat(watch('amount')) > 0 && (
            <div className="text-xs text-slate-500 space-y-1">
              <div>Redemption fee: {getRedemptionFee(watch('amount'))} {selectedToken}</div>
              <div>Net amount: {watch('amount') ? (parseFloat(watch('amount')) * rate - parseFloat(getRedemptionFee(watch('amount'))) * rate).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'} IDR</div>
            </div>
          )}
          {step !== 'idle' && (
            <div className="text-xs text-blue-400">
              Status: {step === 'burning' ? 'Burning tokens...' : step === 'submitting' ? 'Submitting request...' : 'Processing...'}
            </div>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="bankAccountId" className="text-sm font-medium text-slate-300">To</Label>
            <AddRecipientModal onSuccess={handleAddRecipientSuccess} />
          </div>
          <Select onValueChange={(value) => setValue('bankAccountId', value)} value={watch('bankAccountId')}>
            <SelectTrigger className="w-full py-6 rounded-lg bg-slate-200 border border-slate-300 text-slate-800">
              <SelectValue placeholder="Choose Bank Account" />
            </SelectTrigger>
            <SelectContent className="bg-slate-200 text-slate-800 border border-slate-300">
              {isLoadingAccounts ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                bankAccounts.map((account) => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.bankName} - {account.bankAccountNumber}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {errors.bankAccountId && <p className="mt-1 text-sm text-red-600">{errors.bankAccountId.message}</p>}
        </div>

        <Button 
          type="submit" 
          className="w-full flex items-center justify-center bg-blue-600 hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 text-white font-semibold py-3 rounded-lg disabled:opacity-50" 
          disabled={
            isProcessing || 
            redeemMutation.isPending || 
            isLoadingAccounts || 
            !isConnected ||
            !SUPPORTED_CHAINS_NORMAL.some(c => c.id === selectedChain.id) ||
            !tokenBalance ||
            parseFloat(tokenBalance) === 0
          }
        >
          <span className="mr-2">
            {isProcessing ? (
              step === 'burning' ? 'Burning Tokens...' :
              step === 'submitting' ? 'Submitting...' :
              'Processing...'
            ) : 'Review Redeem'}
          </span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}