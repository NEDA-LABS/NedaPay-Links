'use client';

import React, { useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, LogOut, Settings, Users, BarChart3,
  Shield, Menu, X, Bell, ArrowRightLeft, UserPlus, Share2,
} from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OnboardingForm } from '@/idrxco/components/OnboardingForm';
import OnboardingStatus from './components/OnboardingStatus';

// IMPORT THE TAB COMPONENTS
import OfframpTransactions from './components/OfframpTransactions';
import BroadcastNotifications from './components/PushNotifications';
// import UserOnboarding from './components/UserOnboarding';
import Referrals from './components/Referrals';

type AdminLayoutProps = { children?: React.ReactNode };

const navigationItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

// Updated tabs - removed href since we're not routing anymore
const tabItems = [
  { name: 'Offramp Transactions', key: 'offramp', icon: ArrowRightLeft },
  { name: 'Broadcast Notifications', key: 'notifications', icon: Bell },
  { name: 'User Onboarding · IDRXCO', key: 'onboarding', icon: UserPlus },
  { name: 'Referrals Analytics', key: 'referrals', icon: Share2 },
];

// Map tab keys to components
const TabComponents: Record<string, React.ComponentType> = {
  offramp: OfframpTransactions,
  notifications: BroadcastNotifications,
  onboarding: () => (
    <div className="w-full grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="max-w-3xl w-full mx-auto xl:mx-0">
        <OnboardingForm />
      </div>
      <div className="w-full">
        <OnboardingStatus />
      </div>
    </div>
  ),
  referrals: Referrals,
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // State to track active tab
  const [activeTab, setActiveTab] = useState<string>('offramp');

  const handleLogout = () => {
    document.cookie = 'admin-access-key=; Path=/; Max-Age=0; SameSite=Lax';
    router.push('/admin/login');
  };

  const currentSectionTitle = useMemo(() => {
    const match = navigationItems.find((n) => pathname.startsWith(n.href));
    return match ? match.name : 'Admin';
  }, [pathname]);

  const showTabs = pathname.startsWith('/admin');
  const contentTopPadding = showTabs ? '7rem' : '4rem';

  // Get the active component based on selected tab
  const ActiveTabComponent = TabComponents[activeTab];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-slate-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-slate-900/60 backdrop-blur border-b border-slate-700 flex items-center px-4 sm:px-6">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden text-slate-400 hover:text-white p-2"
          aria-label="Open sidebar"
        >
          <Menu className="w-6 h-6" />
        </button>

        <span className="ml-2 text-sm uppercase tracking-wide text-slate-300/80">
          {currentSectionTitle}
        </span>

        <div className="ml-auto flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-slate-200">Admin User</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center ring-2 ring-indigo-400/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
        </div>
      </header>

      {/* Tabs (Radix) */}
      {showTabs && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
          <div className="fixed top-16 left-0 right-0 z-20 bg-slate-900/50 backdrop-blur border-b border-slate-700">
            <div className="px-4 sm:px-6 py-2 overflow-x-auto">
              <TabsList className="bg-transparent p-0 gap-2">
                {tabItems.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm border transition-colors
                        data-[state=active]:bg-indigo-600/90 data-[state=active]:text-white data-[state=active]:border-indigo-500 data-[state=active]:shadow-sm
                        data-[state=inactive]:bg-slate-800/60 data-[state=inactive]:text-slate-300 data-[state=inactive]:border-slate-700 hover:data-[state=inactive]:bg-slate-800 hover:data-[state=inactive]:text-white"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{tab.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>
          </div>

          {/* Content below tabs */}
          <main style={{ paddingTop: contentTopPadding }}>
            <div className="p-4 sm:p-6">
              <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 backdrop-blur shadow-xl">
                <section className="p-4 sm:p-6 space-y-8">
                  {tabItems.map((tab) => (
                    <TabsContent key={tab.key} value={tab.key} className="mt-0">
                      {(() => {
                        const Comp = TabComponents[tab.key];
                        return Comp ? <Comp /> : null;
                      })()}
                    </TabsContent>
                  ))}

                  {/* Then render any page-specific children you pass into the layout */}
                  {children}
                </section>
              </div>
            </div>

            <footer className="px-6 py-4 text-xs text-slate-500/80">
              © {new Date().getFullYear()} Admin Console
            </footer>
          </main>
        </Tabs>
      )}
    </div>
  );
}