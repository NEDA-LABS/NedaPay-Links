export interface PaymentLink {
  id: string;
  createdAt: string;
  amount: string;
  currency: string;
  status: string;
  url: string;
  description?: string;
  expiresAt: string;
  linkId: string;
  linkType: "NORMAL" | "OFF_RAMP";
  offRampType?: "PHONE" | "BANK_ACCOUNT";
  offRampValue?: string;
  accountName?: string;
  offRampProvider?: string;
  chainId?: number;
}

export interface PaymentLinkFormData {
  amount: string;
  currency: string;
  description: string;
  linkType: "NORMAL" | "OFF_RAMP";
  offRampType: "PHONE" | "BANK_ACCOUNT";
  offRampValue: string;
  accountName: string;
  offRampProvider: string;
  chainId: number;
  expiresAt: string;
  expirationEnabled: boolean;
  specifyChain: boolean;
  specifyCurrency: boolean;
}

export interface Institution {
  name: string;
  code: string;
  type: string;
}

export interface Stablecoin {
  region: string;
  flag: string;
  currency: string;
  baseToken: string;
  name: string;
  decimals: { [key: number]: number } | number;
  addresses: { [key: number]: string };
  issuer: string;
  description: string;
  website: string;
  chainIds: number[];
}