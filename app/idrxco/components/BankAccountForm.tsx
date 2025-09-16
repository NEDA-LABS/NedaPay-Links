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

  // Fetch bank codes
  const { data: bankCodes, isLoading: isLoadingBanks } = useQuery({
    queryKey: ['bank-codes'],
    queryFn: async () => {
      const response = await fetch('/api/idrx/bank-codes');
      if (!response.ok) throw new Error('Failed to fetch bank codes');
      return response.json();
    },
  });

  const addBankMutation = useMutation({
    mutationFn: async (data: BankAccountFormData) => {
      const response = await fetch('/api/idrx/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Add Bank Account</CardTitle>
        <CardDescription>
          Add your Indonesian bank account to receive IDR transfers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankCode">Bank</Label>
              <Select
                onValueChange={(value) => setValue('bankCode', value)}
                value={watch('bankCode')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a bank" />
                </SelectTrigger>
                <SelectContent>
                  {bankCodes?.data?.map((bank: BankCode) => (
                    <SelectItem key={bank.code} value={bank.code}>
                      {bank.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bankCode && (
                <p className="text-sm text-red-600">{errors.bankCode.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Bank Account Number</Label>
              <Input
                id="bankAccountNumber"
                placeholder="1234567890"
                {...register('bankAccountNumber')}
              />
              {errors.bankAccountNumber && (
                <p className="text-sm text-red-600">{errors.bankAccountNumber.message}</p>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || addBankMutation.isPending || isLoadingBanks}
          >
            {isSubmitting ? 'Adding...' : 'Add Bank Account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}