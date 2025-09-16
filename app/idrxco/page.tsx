// app/(dashboard)/dashboard/page.tsx
import { DashboardStats } from './components/DashboardStats';
import { RecentTransactions } from './components/RecentTransactions';
import { QuickActions } from './components/QuickActions';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Manage your IDRX offramping activities</p>
      </div>

      <DashboardStats />
      
      <div className="grid gap-8 md:grid-cols-2">
        <QuickActions />
        <RecentTransactions />
      </div>
    </div>
  );
}