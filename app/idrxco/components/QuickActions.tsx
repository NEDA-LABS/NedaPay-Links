// app/components/dashboard/quick-actions.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Download, Building2, History } from 'lucide-react';
import Link from 'next/link';
import { useWeb3 } from '../utils/Web3Provider';

export function QuickActions() {
  const { isConnected } = useWeb3();

  const actions = [
    {
      title: 'Add Bank Account',
      description: 'Link your Indonesian bank account',
      icon: Building2,
      href: '/dashboard/banks/add',
      variant: 'default' as const,
      disabled: false,
    },
    {
      title: 'Redeem IDRX',
      description: 'Convert IDRX to IDR',
      icon: Download,
      href: '/dashboard/redeem',
      variant: 'default' as const,
      disabled: !isConnected,
    },
    {
      title: 'View History',
      description: 'Check your transaction history',
      icon: History,
      href: '/dashboard/transactions',
      variant: 'outline' as const,
      disabled: false,
    },
  ];

  return (
    <Card className="text-slate-800">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link key={index} href={action.disabled ? '#' : action.href}>
                <Button
                  className="w-full justify-start"
                  variant={action.variant}
                  disabled={action.disabled}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-75">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}