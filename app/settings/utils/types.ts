// mirrors the old component state
export interface SettingsDto {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessCategory: string;
    businessDescription: string;
    autoSettlement: boolean;
    settlementThreshold: number;
    settlementCurrency: string;
    paymentExpiry: number;
    twoFactorEnabled: boolean;
    withdrawalConfirmation: boolean;
    transactionNotifications: boolean;
    settlementNotifications: boolean;
    securityAlerts: boolean;
    marketingUpdates: boolean;
    webhookUrl: string;
  }
  
  export interface ApiKey {
    id: string;
    keyId: string;
    environment: string;
    name: string;
    lastUsed?: string;
    createdAt: string;
  }
  
  // referral additions
  export interface ReferralStats {
    code: string;
    inviteLink: string;
    invitees: {
      id: string;
      email?: string;
      wallet?: string;
      volumeUsd: number; // total tx volume
      createdAt: string;
    }[];
  }

  // KYC status returned by Sumsub
export type KycStatus = 'pending' | 'approved' | 'rejected' | null;