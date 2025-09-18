// app/components/banks/bank-account-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import type { BankMethod } from '../utils/types';

const bankAccountSchema = z.object({
  bankAccountNumber: z.string().min(8, 'Bank account number must be at least 8 characters'),
  bankCode: z.string().min(1, 'Please select a bank'),
});

type BankAccountFormData = z.infer<typeof bankAccountSchema>;

interface BankCode {
  code: string;
  name: string;
}

interface BankAccountFormProps {
  onSuccess?: () => void;
}

export function BankAccountForm({ onSuccess }: BankAccountFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<BankAccountFormData>({
    resolver: zodResolver(bankAccountSchema),
  });

  // Fetch available bank methods (bankCode/bankName)
  const { data: methods, isLoading: isLoadingMethods } = useQuery({
    queryKey: ['idrxco-methods'],
    queryFn: async () => {
      const response = await fetch('/api/idrxco/methods');
      if (!response.ok) throw new Error('Failed to fetch bank methods');
      return response.json();
    },
  });

  const addBankMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      // API route expects multipart/form-data (uses req.formData()).
      const form = new FormData();
      form.append('bankAccountNumber', data.bankAccountNumber);
      form.append('bankCode', data.bankCode);
      const response = await fetch('/api/idrxco/bank-accounts', {
        method: 'POST',
        body: form,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add bank account');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success!',
        description: 'Bank account added successfully.',
      });
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.href = '/dashboard/banks';
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add bank account.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BankAccountFormData) => {
    setIsSubmitting(true);
    addBankMutation.mutate(data);
    setIsSubmitting(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-slate-800 border border-slate-700">
      <CardHeader>
        <CardTitle className="text-slate-100">Add Bank Account</CardTitle>
        <CardDescription className="text-slate-300">
          Add your Indonesian bank account to receive IDR transfers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankCode" className="text-sm font-medium text-slate-300">Bank</Label>
              <Select
                onValueChange={(value) => setValue('bankCode', value)}
                value={watch('bankCode')}
              >
                <SelectTrigger className="w-full py-6 rounded-lg bg-slate-200 border border-indigo-700 text-slate-800">
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent className="bg-slate-200 text-slate-800 border border-indigo-700">
                  {isLoadingMethods && (
                    <SelectItem disabled value="loading">
                      Loading banks…
                    </SelectItem>
                  )}
                  {!isLoadingMethods && (!methods?.data || methods.data.length === 0) && (
                    <SelectItem disabled value="empty">
                      No banks available
                    </SelectItem>
                  )}
                  {!isLoadingMethods && methods?.data?.map((bank: BankMethod) => (
                    <SelectItem key={bank.bankCode} value={bank.bankCode}>
                      {bank.bankName} · Max Rp {Number(bank.maxAmountTransfer).toLocaleString('id-ID')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCode && (
                <p className="text-sm text-red-400">{errors.bankCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber" className="text-sm font-medium text-slate-300">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                placeholder="1234567890"
                className="w-full py-6 rounded-lg bg-slate-100 border border-slate-300 text-black placeholder:text-slate-500 focus:ring-indigo-500 focus:border-indigo-500"
                {...register('bankAccountNumber')}
              />
              {errors.bankAccountNumber && (
                <p className="text-sm text-red-400">{errors.bankAccountNumber.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 hover:from-indigo-500 hover:via-purple-500 hover:to-blue-500 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
            disabled={isSubmitting || addBankMutation.isPending || isLoadingMethods}
          >
            {isSubmitting ? 'Adding...' : 'Add Bank Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}