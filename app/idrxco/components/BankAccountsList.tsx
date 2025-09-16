// app/components/banks/bank-accounts-list.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BankAccount {
  id: number;
  bankAccountNumber: string;
  bankAccountName: string;
  bankCode: string;
  bankName: string;
  maxAmountTransfer: string;
  deleted: boolean;
  DepositWalletAddress: {
    walletAddress: string;
    createdAt: string;
  };
}

export function BankAccountsList() {
  const { toast } = useToast();

  const { data: bankAccounts, isLoading, refetch } = useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/idrx/banks');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      return response.json();
    },
  });

  const deleteMutation = async (bankId: string) => {
    const response = await fetch(`/api/idrx/banks/${bankId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete bank account');
    }

    return response.json();
  };

  const handleDelete = async (bankId: string) => {
    try {
      await deleteMutation(bankId);
      toast({
        title: 'Success',
        description: 'Bank account deleted successfully',
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete bank account',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bank Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading bank accounts...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Bank Accounts</CardTitle>
        <Link href="/dashboard/banks/add">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {bankAccounts?.data?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No bank accounts added yet
          </div>
        ) : (
          <div className="space-y-4">
            {bankAccounts?.data?.map((account: BankAccount) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{account.bankName}</span>
                    <Badge variant="outline">
                      Max: Rp {parseFloat(account.maxAmountTransfer).toLocaleString('id-ID')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {account.bankAccountNumber} • {account.bankAccountName}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    Deposit: {account.DepositWalletAddress.walletAddress.slice(0, 6)}...
                    {account.DepositWalletAddress.walletAddress.slice(-4)}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/banks/${account.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Bank Account</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this bank account? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(account.id.toString())}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}