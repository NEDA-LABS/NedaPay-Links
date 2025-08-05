'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import { stablecoins } from '../data/stablecoins';
import { useKycStatus} from '@/hooks/useKycStatus';
import { useKybStatus } from '@/hooks/useKybStatus';
import { withDashboardLayout } from '../utils/withDashboardLayout';
import { Loader } from 'lucide-react';

function SettingsPage() {
  const { user, authenticated } = usePrivy();
  const address = user?.wallet?.address;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // KYC/KYB Status
  const { status: kycStatus, loading: kycLoading } = useKycStatus(address as string);
  const { status: kybStatus, loading: kybLoading } = useKybStatus(address as string);

  // Privy hooks
  const { getAccessToken } = usePrivy();
  const [account, setAccount] = useState('');
  const [isKycSubmitted, setIsKycSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Business Profile
  const [businessName, setBusinessName] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [mounted, setMounted] = useState(false);
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessCategory, setBusinessCategory] = useState('retail');
  const [businessDescription, setBusinessDescription] = useState('');

  // Payment Settings
  const [autoSettlement, setAutoSettlement] = useState(true);
  const [settlementThreshold, setSettlementThreshold] = useState('1000');
  const [settlementCurrency, setSettlementCurrency] = useState('TSHC');
  const [paymentExpiry, setPaymentExpiry] = useState('60');

  // Security Settings
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [withdrawalConfirmation, setWithdrawalConfirmation] = useState(true);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  // Notification Settings
  const [transactionNotifications, setTransactionNotifications] = useState(true);
  const [settlementNotifications, setSettlementNotifications] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [marketingUpdates, setMarketingUpdates] = useState(false);

  const admin1 = process.env.ADMIN1;
  const admin2 = process.env.ADMIN2;
  const admin3 = process.env.ADMIN3;

  const admins = [admin1, admin2, admin3];

  // API Settings
  interface ApiKey {
  id: string;
  keyId: string;
  environment: string;
  name: string;
  lastUsed?: string;
  createdAt: string;
}



const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    if (address) {
      setAccount(address);
    }
  }, [address]);

  useEffect(() => {
    if (mounted && !authenticated) {
      window.location.href = '/dashboard';
    }
  }, [mounted, authenticated]);

  // Fetch settings on mount when connected
  useEffect(() => {
    const fetchSettings = async () => {
      if (!authenticated || !address) return;

      try {
        setIsLoading(true);
        const accessToken = await getAccessToken();
        const response = await fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        const settings = data.settings;

        setBusinessName(settings.businessName || '');
        setBusinessEmail(settings.businessEmail || '');
        setBusinessPhone(settings.businessPhone || '');
        setBusinessCategory(settings.businessCategory || 'retail');
        setBusinessDescription(settings.businessDescription || '');
        setAutoSettlement(settings.autoSettlement ?? true);
        setSettlementThreshold(settings.settlementThreshold?.toString() || '1000');
        setSettlementCurrency(settings.settlementCurrency || 'TSHC');
        setPaymentExpiry(settings.paymentExpiry?.toString() || '60');
        setTwoFactorEnabled(settings.twoFactorEnabled ?? false);
        setWithdrawalConfirmation(settings.withdrawalConfirmation ?? true);
        setTransactionNotifications(settings.transactionNotifications ?? true);
        setSettlementNotifications(settings.settlementNotifications ?? true);
        setSecurityAlerts(settings.securityAlerts ?? true);
        setMarketingUpdates(settings.marketingUpdates ?? false);
        setWebhookUrl(settings.webhookUrl || '');
        setApiKeys(data.apiKeys || []);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    const checkKycStatus = async () => {
      try {
        const response = await fetch(`/api/kyc/submit?wallet=${address}`);
        if (!response.ok) {
          throw new Error('Failed to check KYC status');
        }
        const data = await response.json();
        setIsKycSubmitted(data.isSubmitted);
      } catch (err) {
        console.error('Error checking KYC status:', err);
      }
    };

    fetchSettings();
    checkKycStatus();
  }, [authenticated, address, getAccessToken]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          businessName,
          businessEmail,
          businessPhone,
          businessCategory,
          businessDescription,
          autoSettlement,
          settlementThreshold: settlementThreshold ? Number(settlementThreshold) : undefined,
          settlementCurrency,
          paymentExpiry: paymentExpiry ? Number(paymentExpiry) : undefined,
          twoFactorEnabled,
          withdrawalConfirmation,
          transactionNotifications,
          settlementNotifications,
          securityAlerts,
          marketingUpdates,
          webhookUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const data = await response.json();
      alert(data.message);
    } catch (err) {
      if (err instanceof Error) {
        alert('Error saving settings: ' + err.message);
      } else {
        alert('Error saving settings: An unknown error occurred');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const generateApiKey = async () => {
    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          environment: 'live',
          name: 'Live API Key',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }

      const data = await response.json();
      alert(`API key generated: ${data.apiKey}`);
      setApiKeys((prev) => [...prev, {
        id: data.keyId,
        keyId: data.keyId,
        environment: data.environment,
        name: data.name,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      alert('Error generating API key: ' + errorMessage);
    }
  };

  const revokeApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;

    try {
      const accessToken = await getAccessToken();
      const response = await fetch('/api/settings/api-keys', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ keyId }),
      });

      if (!response.ok) {
        throw new Error('Failed to revoke API key');
      }

      const data = await response.json();
      alert(data.message);
      setApiKeys((prev) => prev.filter((key) => key.keyId !== keyId));
    } catch (err) {
      const error = err as Error;
      alert('Error revoking API key: ' + error.message);
    }
  };

  console.log("kyc/kyb status", kybStatus.status);

  if (!mounted) return null;
  if (isLoading) return <div><Loader className="animate-spin text-blue-500 mx-auto" size={24} /></div>;
  if (error) return <div>Error: {error}</div>;
   
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 transition-colors duration-300">
      <Header />
      {/* <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => window.history.back()}
          className="!group !flex !items-center !gap-2 !px-4 !py-2 !bg-white !border !border-gray-200 !rounded-full !text-sm !font-semibold !text-gray-700 !hover:bg-blue-50 !hover:shadow-md !transition-all !duration-300"
        >
          <span className="transform group-hover:-translate-x-1 transition-transform duration-200">←</span> Back
        </button>
      </div> */}
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Settings</h1>
          <p className="mt-2 text-gray-600 text-lg">Manage your merchant account settings</p>
        </div>
  
        {!authenticated && (
          <div className="bg-gradient-to-r from-blue-100/50 to-indigo-100/50 border border-blue-200/50 rounded-2xl p-8 mb-10 text-center shadow-lg">
            <h2 className="text-2xl font-semibold text-blue-700 mb-3">Connect Your Wallet</h2>
            <p className="text-blue-600 text-base">Connect your wallet to access your merchant settings</p>
          </div>
        )}
        {authenticated && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
            <div className="bg-white rounded-2xl shadow-xl h-fit overflow-hidden border border-gray-100 transition-all duration-300">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">Settings</h2>
              </div>
              <div className="p-4">
                <nav className="space-y-1">
                  {['profile', 'notifications', 'kyc'].map((tab) => (
                    <button
                      key={tab}
                      className={`!w-full !text-left !px-4 !py-3 !rounded-lg !text-sm !font-medium !transition-all !duration-200 ${
                        activeTab === tab
                          ? 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-blue-600'
                      }`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab === 'profile' && 'Profile'}
                      {tab === 'payment' && 'Payment Settings'}
                      {tab === 'security' && 'Security'}
                      {tab === 'notifications' && 'Notifications'}
                      {tab === 'api' && 'API Keys'}
                      {tab === 'kyc' && 'KYC/KYB Verification'}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="p-4 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="text-xs text-gray-500 mb-2">Connected Wallet</div>
                <div className="font-mono text-sm text-gray-800 break-all">{account}</div>
              </div>
            </div>
  
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 transition-all duration-300">
              {activeTab === 'profile' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage your business/individual information</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">User Name</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Email</label>
                        <input
                          type="email"
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={businessEmail}
                          onChange={(e) => setBusinessEmail(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Phone</label>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={businessPhone}
                          onChange={(e) => setBusinessPhone(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Business Category</label>
                        <select
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={businessCategory}
                          onChange={(e) => setBusinessCategory(e.target.value)}
                        >
                          <option value="retail">Retail</option>
                          <option value="food">Food & Beverage</option>
                          <option value="services">Services</option>
                          <option value="technology">Technology</option>
                          <option value="education">Education</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Business Description</label>
                        <textarea
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          rows={4}
                          value={businessDescription}
                          onChange={(e) => setBusinessDescription(e.target.value)}
                        />
                      </div>
                      <div className="pt-4">
                        <button
                          className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed"
                          onClick={saveSettings}
                          disabled={isSaving}
                        >
                          <span className="relative">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
  
              {activeTab === 'payment' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Payment Settings</h2>
                    <p className="text-gray-600 text-sm mt-1">Configure how you receive and manage payments</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={autoSettlement}
                            onChange={(e) => setAutoSettlement(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Enable automatic settlement</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Automatically settle payments to your wallet when they reach the threshold</p>
                      </div>
                      {autoSettlement && (
                        <div>
                          <label className="block text-gray-700 font-medium mb-2">Settlement Threshold</label>
                          <div className="flex">
                            <input
                              type="text"
                              className="flex-grow p-3 border border-gray-300 rounded-l-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              value={settlementThreshold}
                              onChange={(e) => setSettlementThreshold(e.target.value)}
                            />
                            <select
                              className="p-3 border border-gray-300 border-l-0 rounded-r-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              value={settlementCurrency}
                              onChange={(e) => setSettlementCurrency(e.target.value)}
                            >
                              {stablecoins.map((coin) => (
                                <option key={coin.baseToken} value={coin.baseToken}>
                                  {coin.baseToken} - {coin.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="block text-gray-700 font-medium mb-2">Payment Link Expiry</label>
                        <div className="flex">
                          <input
                            type="text"
                            className="flex-grow p-3 border border-gray-300 rounded-l-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            value={paymentExpiry}
                            onChange={(e) => setPaymentExpiry(e.target.value)}
                          />
                          <span className="p-3 border border-gray-300 border-l-0 rounded-r-lg bg-gray-50 text-gray-800 font-medium">minutes</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Payment links will expire after this duration</p>
                      </div>
                      <div className="pt-4">
                        <button
                          className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed"
                          onClick={saveSettings}
                          disabled={isSaving}
                        >
                          <span className="relative">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
  
              {activeTab === 'security' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Security Settings</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage security options for your merchant account</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={twoFactorEnabled}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              if (checked) {
                                try {
                                  const accessToken = await getAccessToken();
                                  const response = await fetch('/api/settings/2fa', {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${accessToken}` },
                                  });
                                  if (!response.ok) throw new Error('Failed to setup 2FA');
                                  const data = await response.json();
                                  setTwoFactorSecret(data.secret);
                                  setQrCodeUrl(data.qrCode);
                                  setShow2FASetup(true);
                                } catch (err) {
                                  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                                  alert('Error setting up 2FA: ' + errorMessage);
                                }
                              } else {
                                const token = prompt('Enter your 2FA token to disable:');
                                if (token) {
                                  try {
                                    const accessToken = await getAccessToken();
                                    const response = await fetch('/api/settings/2fa', {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${accessToken}`,
                                      },
                                      body: JSON.stringify({ token }),
                                    });
                                    if (!response.ok) throw new Error('Failed to disable 2FA');
                                    const data = await response.json();
                                    alert(data.message);
                                    setTwoFactorEnabled(false);
                                    setShow2FASetup(false);
                                  } catch (err) {
                                    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                                    alert('Error disabling 2FA: ' + errorMessage);
                                  }
                                }
                              }
                            }}
                          />
                          <span className="text-gray-700 font-medium">Enable Two-Factor Authentication</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Add an extra layer of security to your account</p>
                      </div>
                      {show2FASetup && (
                        <div className="ml-6 p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-lg shadow-sm">
                          <p className="text-blue-700 font-medium mb-2">Two-Factor Authentication Setup</p>
                          <p className="text-blue-600 text-sm mb-4">Scan the QR code with your authenticator app and enter the verification code</p>
                          <div className="flex justify-center mb-4">
                            <img src={qrCodeUrl} alt="2FA QR Code" className="w-40 h-40 rounded-lg border border-gray-200" />
                          </div>
                          <div className="flex justify-center space-x-4">
                            <input
                              type="text"
                              className="p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Enter verification code"
                              value={verificationToken}
                              onChange={(e) => setVerificationToken(e.target.value)}
                            />
                            <button
                              className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300"
                              onClick={async () => {
                                try {
                                  const accessToken = await getAccessToken();
                                  const response = await fetch('/api/settings/2fa', {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'Authorization': `Bearer ${accessToken}`,
                                    },
                                    body: JSON.stringify({ token: verificationToken }),
                                  });
                                  if (!response.ok) throw new Error('Failed to verify 2FA');
                                  const data = await response.json();
                                  alert(data.message);
                                  setTwoFactorEnabled(true);
                                  setShow2FASetup(false);
                                  setVerificationToken('');
                                } catch (err) {
                                  const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
                                  alert('Error verifying 2FA: ' + errorMessage);
                                }
                              }}
                            >
                              <span className="relative">Verify</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={withdrawalConfirmation}
                            onChange={(e) => setWithdrawalConfirmation(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Require confirmation for withdrawals</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Send email confirmation for all withdrawal requests</p>
                      </div>
                      <div className="pt-4">
                        <button
                          className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed"
                          onClick={saveSettings}
                          disabled={isSaving}
                        >
                          <span className="relative">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
  
              {activeTab === 'notifications' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Notification Settings</h2>
                    <p className="text-gray-600 text-sm mt-1">Configure how you receive notifications</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={transactionNotifications}
                            onChange={(e) => setTransactionNotifications(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Transaction Notifications</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Receive notifications for all incoming payments</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={settlementNotifications}
                            onChange={(e) => setSettlementNotifications(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Settlement Notifications</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Receive notifications when funds are settled to your wallet</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={securityAlerts}
                            onChange={(e) => setSecurityAlerts(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Security Alerts</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Receive notifications about security events</p>
                      </div>
                      <div>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 transition-all duration-200"
                            checked={marketingUpdates}
                            onChange={(e) => setMarketingUpdates(e.target.checked)}
                          />
                          <span className="text-gray-700 font-medium">Marketing Updates</span>
                        </label>
                        <p className="text-gray-500 text-sm mt-1 ml-6">Receive updates about new features and promotions</p>
                      </div>
                      <div className="pt-4">
                        <button
                          className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed"
                          onClick={saveSettings}
                          disabled={isSaving}
                        >
                          <span className="relative">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
  
              {activeTab === 'api' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">API Keys</h2>
                    <p className="text-gray-600 text-sm mt-1">Manage API keys for integrating with your systems</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {apiKeys.map((key) => (
                        <div key={key.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 shadow-sm border border-gray-200">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h3 className="font-medium text-gray-800">{key.name}</h3>
                              <p className="text-xs text-gray-500">Environment: {key.environment}</p>
                              {key.lastUsed && (
                                <p className="text-xs text-gray-500">
                                  Last used: {new Date(key.lastUsed).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <button
                              className="!text-red-600 !text-sm !font-medium !hover:text-red-700 !transition-colors !duration-200"
                              onClick={() => revokeApiKey(key.keyId)}
                            >
                              Revoke
                            </button>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-300 font-mono text-sm break-all">
                            {key.keyId}
                          </div>
                        </div>
                      ))}
                      <div>
                        <button
                          className="!group !relative !bg-gradient-to-r !from-green-600 !to-green-500 !hover:from-green-700 !hover:to-green-600 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300"
                          onClick={generateApiKey}
                        >
                          <span className="relative">Generate New API Key</span>
                        </button>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800 mb-2">Webhook URL</h3>
                        <input
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://your-website.com/nedapay-webhook"
                        />
                        <p className="text-gray-500 text-sm mt-1">We'll send payment notifications to this URL</p>
                      </div>
                      <div className="pt-4">
                        <button
                          className="!group !relative !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-700 !hover:to-indigo-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !shadow-lg !hover:shadow-xl !transition-all !duration-300 !disabled:opacity-50 !disabled:cursor-not-allowed"
                          onClick={saveSettings}
                          disabled={isSaving}
                        >
                          <span className="relative">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
  
              {activeTab === 'kyc' && (
                <>
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">KYC/KYB Verification</h2>
                    <p className="text-gray-600 text-sm mt-1">Complete identity verification to access all features</p>
                  </div>
                  <div className="p-6">
                    <div className="max-w-2xl mx-auto">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-100">
                        <div className="flex items-start gap-4">
                          <div className="bg-blue-100 p-3 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify Your Identity</h3>
                            <p className="text-gray-600 mb-4">
                              To comply with financial regulations and unlock all platform features, please complete our identity verification process.
                              This typically takes less than 5 minutes.
                            </p>
                            {(kybStatus.status === 'SUBMITTED' || kycStatus.status === 'SUBMITTED') ? (
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <span className="text-blue-600 font-medium">Verification In Progress</span>
                              </div>
                            ) : ((kybStatus.details?.createdAt) || kycStatus.details?.createdAt) ? (
                              <a
                                href="/compliance/user"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                              >
                                Continue Verification
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </a>
                            ) : (
                              <a
                                href="/compliance/user"
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
                              >
                                Begin Verification
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
  
                      {/* <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-4">Verification Status</h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${kycStatus === 'verified' ? 'bg-green-100 text-green-600' : kycStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                                {kycStatus === 'verified' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : kycStatus === 'pending' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-medium">Identity Verification</span>
                            </div>
                            <span className={`text-sm font-medium ${
                              kycStatus === 'verified' ? 'text-green-600' : 
                              kycStatus === 'pending' ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {kycStatus === 'verified' ? 'Verified' : kycStatus === 'pending' ? 'Pending Review' : 'Not Started'}
                            </span>
                          </div>
  
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${kybStatus === 'verified' ? 'bg-green-100 text-green-600' : kybStatus === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-600'}`}>
                                {kybStatus === 'verified' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : kybStatus === 'pending' ? (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="font-medium">Business Verification</span>
                            </div>
                            <span className={`text-sm font-medium ${
                              kybStatus === 'verified' ? 'text-green-600' : 
                              kybStatus === 'pending' ? 'text-amber-600' : 'text-gray-600'
                            }`}>
                              {kybStatus === 'verified' ? 'Verified' : kybStatus === 'pending' ? 'Pending Review' : 'Not Started'}
                            </span>
                          </div>
                        </div>
                      </div> */}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }

export default withDashboardLayout(SettingsPage);
