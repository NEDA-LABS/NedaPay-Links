// app/(dashboard)/layout.tsx
import { DashboardNav } from './components/DashboardNav';
import { DashboardProvider } from './components/DashboardProvider';
import { Web3Provider } from './utils/Web3Provider';
import Sidebar from './components/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Web3Provider>
      <DashboardProvider>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1">
            {/* <DashboardNav /> */}
            <main className="container mx-auto py-8 px-4">
              {children}
            </main>
          </div>
        </div>
      </DashboardProvider>
    </Web3Provider>
  );
}