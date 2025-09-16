// app/components/redeem/redeem-form.tsx
'use client';

import { useState } from 'react';
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
import { useWeb3 } from '../utils/Web3Provider';
import { ethers } from 'ethers';

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
  const { web3Service, balance, isLoadingBalance, refetchBalance } = useWeb3();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RedeemFormData>({
    resolver: zodResolver(redeemSchema),
  });

  const { data: bankAccounts = [], isLoading: isLoadingAccounts } = useQuery<BankAccount[]>({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/idrx/banks');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const result = await response.json();
      return result.data ?? result;
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (data: RedeemFormData) => {
      const selectedAccount = bankAccounts.find((account) => account.id === parseInt(data.bankAccountId));
      if (!selectedAccount) throw new Error('Selected bank account not found');
      if (!web3Service) throw new Error('Web3 service not available');

      const amountInWei = ethers.utils.parseUnits(data.amount, 18);
      const balanceInWei = ethers.utils.parseUnits(balance || '0', 18);
      if (amountInWei.gt(balanceInWei)) throw new Error('Insufficient IDRX balance');

      const txHash = await web3Service.burnIDRX(data.amount, selectedAccount.bankAccountNumber, selectedAccount.bankName);
      const receipt = await web3Service.getTransactionReceipt(txHash);
      if (!receipt.status) throw new Error('Burn transaction failed');

      const payload = {
        amount: data.amount,
        bankAccount: selectedAccount.bankAccountNumber,
        bankCode: selectedAccount.bankCode,
        bankName: selectedAccount.bankName,
        walletAddress: await web3Service.getSignerAddress(),
        txHash,
      };

      const response = await fetch('/api/idrx/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to process redeem request');
      }
      refetchBalance();
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'Success!', description: 'Redeem request submitted successfully. You will receive IDR in your bank account within 24 hours.' });
      setValue('amount', '');
      setValue('bankAccountId', '');
    },
    onError: (error) => {
      toast({ title: 'Error', description: (error as Error).message || 'Failed to process redeem request.', variant: 'destructive' });
    },
  });

  const onSubmit = (data: RedeemFormData) => {
    setIsSubmitting(true);
    redeemMutation.mutate(data);
    setIsSubmitting(false);
  };

  const handleAddRecipientSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
  };

  const handleMaxAmount = () => setValue('amount', balance);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Redeem</h1>
        <Info className="h-5 w-5 text-gray-400" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
    const balanceInWei = ethers.utils.parseUnits(balance, 18);
    
    if (amountInWei.gt(balanceInWei)) {
      throw new Error('Insufficient IDRX balance');
    }

    const txHash = await web3Service.burnIDRX(
      data.amount,
      selectedAccount.bankAccountNumber,
      selectedAccount.bankName
    );

    const receipt = await web3Service.getTransactionReceipt(txHash);
    if (!receipt.status) {
      throw new Error('Burn transaction failed');
    }

    const payload = {
      amount: data.amount,
      bankAccount: selectedAccount.bankAccountNumber,
      bankCode: selectedAccount.bankCode,
      bankName: selectedAccount.bankName,
      walletAddress: await web3Service.getSignerAddress(),
      txHash,
    };

    const response = await fetch('/api/idrx/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to process redeem request');
    }

    refetchBalance();
    return response.json();
  },
  onSuccess: () => {
    toast({
      title: 'Success!',
      description: 'Redeem request submitted successfully. You will receive IDR in your bank account within 24 hours.',
    });
    setValue('amount', '');
    setValue('bankAccountId', '');
  },
  onError: (error) => {
    toast({
      title: 'Error',
      description: error.message || 'Failed to process redeem request.',
      variant: 'destructive',
    });
  },
});

const onSubmit = (data: RedeemFormData) => {
  setIsSubmitting(true);
  redeemMutation.mutate(data);
  setIsSubmitting(false);
};

const handleAddRecipientSuccess = () => {
  queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
};

const handleMaxAmount = () => {
  setValue('amount', balance);
};

return (
  <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-lg p-6 sm:p-8">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Redeem</h1>
      <Info className="h-5 w-5 text-gray-400" />
    </div>

    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="amount" className="text-sm font-medium text-gray-600">You will redeem</Label>
            <div className="text-sm text-gray-500">
              <span className="font-medium">{isLoadingBalance ? '...' : parseFloat(balance).toLocaleString('id-ID')} IDRX</span>
              <Button variant="link" type="button" onClick={handleMaxAmount} className="h-auto p-0 ml-2 text-sm font-semibold text-blue-600">
                Max
              </Button>
            </div>
          </div>
          <div className="relative">
            <Input
              id="amount"
              type="number"
              placeholder="Amount"
              className="w-full pl-4 pr-32 py-6 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              {...register('amount')}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full">
                <Image src="/idrx-coin.png" alt="IDRX on BSC" width={24} height={24} />
                <span className="font-semibold text-gray-700">IDRX on BSC</span>
              </div>
            </div>
          </div>
          {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <Label htmlFor="receiveAmount" className="text-sm font-medium text-gray-600">You will receive</Label>
          <div className="relative mt-1">
            <Input
              id="receiveAmount"
              type="number"
              placeholder="Amount"
              className="w-full pl-4 pr-24 py-6 border-gray-300 rounded-lg bg-gray-50"
              value={watch('amount')}
              readOnly
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-gray-700">IDR</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Exchange rate: <span className="font-medium text-gray-700">1 = 1 IDR</span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <Label htmlFor="bankAccountId" className="text-sm font-medium text-gray-600">To</Label>
            <AddRecipientModal onSuccess={handleAddRecipientSuccess} />
          </div>
          <Select onValueChange={(value) => setValue('bankAccountId', value)} value={watch('bankAccountId')}>
            <SelectTrigger className="w-full py-6 border-gray-300 rounded-lg">
              <SelectValue placeholder="Choose Bank Account" />
            </SelectTrigger>
            <SelectContent>
              {isLoadingAccounts ? (
                <SelectItem value="loading" disabled>Loading...</SelectItem>
              ) : (
                bankAccounts?.map((account: BankAccount) => (
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
          className="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold py-3 rounded-lg disabled:opacity-50"
          disabled={isSubmitting || redeemMutation.isPending || isLoadingAccounts}
        >
          <span className="mr-2">Review Redeem</span>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
}