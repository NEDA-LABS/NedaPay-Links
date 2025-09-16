// app/components/dashboard/dashboard-stats.tsx
'use client';

import { useDashboard } from './DashboardProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Wallet, TrendingUp, Building2, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/utils';

export function DashboardStats() {
  const { stats, isLoading, refetchData } = useDashboard();

  const statItems = [
    {
      title: 'Total Redeemed',
      value: isLoading ? '...' : `Rp ${formatCurrency(stats.totalRedeemed)}`,
      icon: TrendingUp,
      color: 'text-green-600',
    },
    {
      title: 'Total Transactions',
      value: isLoading ? '...' : stats.totalTransactions.toString(),
      icon: Wallet,
      color: 'text-blue-600',
    },
    {
      title: 'Bank Accounts',
      value: isLoading ? '...' : stats.activeBankAccounts.toString(),
      icon: Building2,
      color: 'text-purple-600',
    },
    {
      title: 'Pending',
      value: isLoading ? '...' : stats.pendingTransactions.toString(),
      icon: Clock,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 ">
      {statItems.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="relative overflow-hidden text-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-800">{stat.title}</CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
      
      <div className="md:col-span-2 lg:col-span-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={refetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
    </div>
  );
}