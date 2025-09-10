export const TABS = [
  'profile',
  // 'payment',
  // 'security',
  // 'notifications',
  // 'api',
  'referrals',
  // 'kyc',
] as const;
  
  export type TabId = typeof TABS[number];