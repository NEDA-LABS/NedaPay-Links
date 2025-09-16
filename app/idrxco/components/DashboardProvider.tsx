// app/providers/dashboard-provider.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface DashboardContextType {
  stats: {
    totalRedeemed: number;
    totalTransactions: number;
    activeBankAccounts: number;
    pendingTransactions: number;
  };
  recentTransactions: any[];
  isLoading: boolean;
  refetchData: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState({
    totalRedeemed: 0,
    totalTransactions: 0,
    activeBankAccounts: 0,
    pendingTransactions: 0,
  });

  const { data: transactions, refetch: refetchTransactions } = useQuery({
    queryKey: ['dashboard-transactions'],
    queryFn: async () => {
      const response = await fetch('/api/idrx/transactions');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: bankAccounts, refetch: refetchBankAccounts } = useQuery({
    queryKey: ['dashboard-bank-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/idrx/banks');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      return response.json();
    },
  });

  useEffect(() => {
    if (transactions?.data && bankAccounts?.data) {
      const totalRedeemed = transactions.data
        .filter((tx: any) => tx.burnStatus === 'COMPLETED')
        .reduce((sum: number, tx: any) => sum + parseFloat(tx.amount), 0);

      const pendingTransactions = transactions.data.filter(
        (tx: any) => tx.burnStatus === 'REQUESTED' || tx.burnStatus === 'PROCESSING'
      ).length;

      setStats({
        totalRedeemed,
        totalTransactions: transactions.data.length,
        activeBankAccounts: bankAccounts.data.filter((acc: any) => !acc.deleted).length,
        pendingTransactions,
      });
    }
  }, [transactions, bankAccounts]);

  const refetchData = () => {
    refetchTransactions();
    refetchBankAccounts();
  };

  const recentTransactions = transactions?.data?.slice(0, 5) || [];

  return (
    <DashboardContext.Provider
      value={{
        stats,
        recentTransactions,
        isLoading: !transactions || !bankAccounts,
        refetchData,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}