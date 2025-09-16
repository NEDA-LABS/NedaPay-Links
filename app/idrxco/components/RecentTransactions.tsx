// app/components/dashboard/recent-transactions.tsx
'use client';

import { useDashboard } from './DashboardProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import Link from 'next/link';

export function RecentTransactions() {
  const { recentTransactions, isLoading } = useDashboard();

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      REQUESTED: "secondary",
      PROCESSING: "outline",
      COMPLETED: "default",
      FAILED: "destructive",
    };

    return (
      <Badge 
        variant={variants[status] || "default"}
        className={status === 'COMPLETED' ? 'bg-green-100 text-green-800' : ''}
      >
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="text-slate-800">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading transactions...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="text-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Link href="/dashboard/transactions">
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-4">
            {recentTransactions.map((transaction: any) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      Rp {parseFloat(transaction.amount).toLocaleString('id-ID')}
                    </span>
                    {getStatusBadge(transaction.burnStatus)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {transaction.bankName} • {transaction.bankAccountNumber}
                  </div>
                  <div className="text-xs text-gray-400">
                    {format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/transactions/${transaction.id}`}>
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}