export interface PaymentLink {
  id: string;
  createdAt: string; // Or Date
  amount: number;
  currency: string;
  description?: string;
  status: 'active' | 'pending' | 'expired';
  expiresAt: string; // or Date
}
