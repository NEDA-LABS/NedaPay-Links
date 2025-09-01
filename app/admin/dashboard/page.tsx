// app/admin/dashboard/page.tsx

import OfframpTransactions from '@/components/(admin)/OfframpTransactions';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Offramp Transactions',
  description: 'Monitor and analyze offramp payment transactions',
};

export default function AdminDashboardPage() {
  return (
    <main>
      <OfframpTransactions />
    </main>
  );
}