'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { Loader } from 'lucide-react';
import { withDashboardLayout } from '@/utils/withDashboardLayout';
import { TABS, TabId } from './utils/constants';
import { tabLabel } from './utils/utils';
import { SettingsDto, ApiKey, ReferralStats } from './utils/types';

import ProfileTab from './tabs/ProfileTab';
// import PaymentTab from './tabs/PaymentTab';
import SecurityTab from './tabs/SecurityTab';
import NotificationsTab from './tabs/NotificationsTab';
import ApiTab from './tabs/ApiTab';
import ReferralTab from './tabs/ReferralTab';
import KycTab from './tabs/KycTab';

// original admin env vars
const admins = [process.env.NEXT_PUBLIC_ADMIN1, process.env.NEXT_PUBLIC_ADMIN2, process.env.NEXT_PUBLIC_ADMIN3];

function SettingsPage() {
  const { user, authenticated, getAccessToken } = usePrivy();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // settings state (exactly like original)
  const [settings, setSettings] = useState<SettingsDto>({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    businessCategory: 'retail',
    businessDescription: '',
    autoSettlement: true,
    settlementThreshold: 1000,
    settlementCurrency: 'TSHC',
    paymentExpiry: 60,
    twoFactorEnabled: false,
    withdrawalConfirmation: true,
    transactionNotifications: true,
    settlementNotifications: true,
    securityAlerts: true,
    marketingUpdates: false,
    webhookUrl: '',
  });

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // original mount + auth logic
  useEffect(() => {
    if (!authenticated && !loading) {
      router.replace('/dashboard');
    }
  }, [authenticated, loading, router]);

  // initial fetch
  useEffect(() => {
    if (!authenticated) return;
    (async () => {
      try {
        setLoading(true);
        const tk = await getAccessToken();
        const res = await fetch('/api/settings', { headers: { Authorization: `Bearer ${tk}` } });
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json();
        setSettings(json.settings);
        setApiKeys(json.apiKeys || []);
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [authenticated, getAccessToken]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const tk = await getAccessToken();
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('save failed');
      const msg = await res.json();
      alert(msg.message);
    } catch (e: any) {
      alert('Error saving settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <Loader className="animate-spin text-blue-600" size={24} />
        </div>
      </div>
    );
  }

  // render individual tab
  const renderTab = () => {
    const props = { onSave: saveSettings, isSaving: saving };
    const handleChange = (delta: Partial<SettingsDto>) => 
      setSettings(prev => ({ ...prev, ...delta }));
      
    switch (activeTab) {
      case 'profile':
        return <ProfileTab data={settings} onChange={handleChange} {...props} />;
    //   case 'payment':
    //     return <PaymentTab data={settings} onChange={handleChange} {...props} />;
    //   case 'security':
    //     return <SecurityTab data={settings} onChange={handleChange} {...props} />;
    //   case 'notifications':
    //     return <NotificationsTab data={settings} onChange={handleChange} {...props} />;
    //   case 'api':
    //     return (
    //       <ApiTab
    //         keys={apiKeys}
    //         webhookUrl={settings.webhookUrl}
    //         onChangeWebhook={(v) => handleChange({ webhookUrl: v })}
    //         {...props}
    //       />
    //     );
      case 'referrals':
        return <ReferralTab />;
    //   case 'kyc':
    //     return <KycTab />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-100 to-indigo-100 bg-clip-text text-transparent">Settings</h1>
          <p className="mt-2 text-gray-200 text-sm">Manage your merchant account settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* ---- Desktop Sidebar ---- */}
          <div className="hidden lg:block bg-gray-800 rounded-2xl shadow-xl h-fit overflow-hidden transition-all duration-300">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
            </div>
            <div className="p-4">
              <nav className="space-y-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === t ? 'bg-blue-100 !text-blue-700' : '!text-gray-100 hover:bg-blue-700'}`}
                    onClick={() => setActiveTab(t)}
                  >
                    {tabLabel(t)}
                  </button>
                ))}
              </nav>
            </div>
            <div className="p-4 bg-gray-800 rounded-b-2xl">
              <div className="text-xs text-gray-100 mb-2">Connected Wallet</div>
              <div className="font-mono text-xs text-gray-100 break-all">{user?.wallet?.address}</div>
            </div>
          </div>

          {/* ---- Mobile Tab Nav ---- */}
          <div className="lg:hidden sticky top-16 z-10 bg-gray-900 pt-2 pb-1 overflow-x-auto shadow-md rounded-2xl">
            <div className="flex space-x-2 px-2">
              {TABS.map((t) => (
                <button
                  key={t}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${activeTab === t ? 'bg-blue-100 text-blue-700' : 'text-gray-100 hover:bg-blue-700'}`}
                  onClick={() => setActiveTab(t)}
                >
                  {tabLabel(t)}
                </button>
              ))}
            </div>
            <div className="mt-2 px-4 py-2 bg-gray-50 rounded-lg mx-2">
              <div className="text-xs text-gray-500 mb-1">Connected Wallet</div>
              <div className="font-mono text-xs text-gray-700 truncate">{user?.wallet?.address}</div>
            </div>
          </div>

          {/* ---- Tab Content ---- */}
          <div className="lg:col-span-3 bg-gray-800 rounded-2xl shadow-xl">{renderTab()}</div>
        </div>
      </div>
    </div>
  );
}

export default withDashboardLayout(SettingsPage);