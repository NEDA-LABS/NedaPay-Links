export interface PaymentLink {
    id: string;
    merchantId: string;
    url: string;
    amount: number;
    currency: string;
    description?: string;
    status: string;
    createdAt: Date | string;
    redeemedAt?: Date | string;
    invoiceId?: string;
    expiresAt: Date | string;
    signature: string;
    linkId?: string;
    type: string;
    chain: string;
    metadata?: {
      mobile?: string;
    };
  }
  
  export interface Stablecoin {
    region: string;
    flag: string;
    currency: string;
    baseToken: string;
    name: string;
    addresses: Record<number, string>;
    issuer: string;
    description: string;
    website: string;
    chainIds: number[];
    decimals: number | Record<number, number>;
  }