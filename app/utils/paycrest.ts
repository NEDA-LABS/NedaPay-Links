import axios from 'axios';

const PAYCREST_API_URL = 'https://api.paycrest.io';
const CLIENT_ID = process.env.PAYCREST_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYCREST_CLIENT_SECRET!;

const headers = {
  'API-Key': CLIENT_ID,
  'Content-Type': 'application/json',
};

interface Recipient {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  memo: string;
  providerId?: string;
}

interface PaymentOrderPayload {
  amount: number;
  rate: number;
  network: 'base';
  token: 'USDC';
  recipient: Recipient;
  returnAddress?: string;
  reference?: string;
}

interface PaymentOrderResponse {
  message: string;
  status: string;
  data: {
    id: string;
    amount: string;
    token: string;
    network: string;
    receiveAddress: string;
    validUntil: string;
    senderFee: string;
    transactionFee: string;
    reference?: string;
  };
}

export async function initiatePaymentOrder(payload: PaymentOrderPayload): Promise<PaymentOrderResponse> {
  const response = await axios.post(`${PAYCREST_API_URL}/v1/sender/orders`, payload, { headers });
  return response.data;
}

export async function fetchTokenRate(token: 'USDC', amount: number, fiat: string, providerId?: string): Promise<string> {
  const query = providerId ? `?provider_id=${providerId}` : '';
  const response = await axios.get(`${PAYCREST_API_URL}/v1/rates/${token}/${amount}/${fiat}`, { headers });
  return response.data.data;
}

export async function verifyAccount(institution: string, accountIdentifier: string): Promise<string> {
  const response = await axios.post(
    `${PAYCREST_API_URL}/v1/verify-account`,
    { institution, accountIdentifier },
    { headers }
  );
  return response.data.data;
}

export async function fetchSupportedInstitutions(currencyCode: string): Promise<Array<{ name: string; code: string; type: string }>> {
  const response = await axios.get(`${PAYCREST_API_URL}/v1/institutions/${currencyCode}`, { headers });
  return response.data.data;
}

export async function fetchSupportedCurrencies(): Promise<Array<{ code: string; name: string; shortName: string; decimals: number; symbol: string; marketRate: string }>> {
  const response = await axios.get(`${PAYCREST_API_URL}/v1/currencies`, { headers });
  return response.data.data;
}