import { TabId } from './constants';

export const tabLabel = (t: TabId): string => {
  const map: Record<TabId, string> = {
    profile: 'Profile',
    // payment: 'Payment Settings',
    // security: 'Security',
    // notifications: 'Notifications',
    // api: 'API Keys',
    referrals: 'Referrals',
    // kyc: 'KYC',
  };
  return map[t];
};