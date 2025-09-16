// app/components/dashboard/dashboard-nav.tsx
'use client';

import Link from 'next/link';
// import { useWeb3 } from '../utils/web3-provider';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export function DashboardNav() {
//   const { isConnected, connectWallet } = useWeb3();
  const { logout, authenticated, user } = usePrivy();
  const connectWallet = user?.wallet?.address

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              IDRX Offramp
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
              <Link href="/dashboard/banks" className="text-gray-600 hover:text-gray-900">
                Bank Accounts
              </Link>
              <Link href="/dashboard/redeem" className="text-gray-600 hover:text-gray-900">
                Redeem
              </Link>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!authenticated ? (
              <Button  size="sm">
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-green-600">● Connected</span>
                <Button onClick={logout} variant="ghost" size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}