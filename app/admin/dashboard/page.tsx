// app/admin/dashboard/page.tsx

import OfframpTransactions from '@/admin/components/OfframpTransactions';
import AdminLayout from '@/admin/Admin';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Offramp Transactions',
  description: 'Monitor and analyze offramp payment transactions',
};

export default function AdminDashboardPage() {
  return (
    <main>
      <AdminLayout children={undefined} />
    </main>
  );
}