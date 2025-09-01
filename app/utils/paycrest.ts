import axios from 'axios';

export const PAYCREST_API_URL = 'https://api.paycrest.io';
const CLIENT_ID = process.env.PAYCREST_CLIENT_ID!;
const CLIENT_SECRET = process.env.PAYCREST_CLIENT_SECRET!;

const headers = {
  'API-Key': CLIENT_ID,
  'Content-Type': 'application/json',
};

interface PaymentOrder {
  id: string;
  amount: string;
  amountPaid: string;
  amountReturned: string;
  token: string;
  senderFee: string;
  transactionFee: string;
  rate: string;
  network: string;
  gatewayId: string;
  reference: string;
  recipient: Recipient;
  fromAddress: string;
  returnAddress: string;
  receiveAddress: string;
  feeAddress: string;
  createdAt: string;
  updatedAt: string;
  txHash: string;
  status: string;
}

interface FetchOrdersResponse {
  message: string;
  status: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    orders: PaymentOrder[];
    summary?: {
      totalTransactions: number;
      totalAmount: number;
      totalAmountPaid: number;
      totalFees: number;
      byStatus: Record<string, number>;
      byToken: Record<string, { count: number; totalAmount: number; totalPaid: number }>;
      byNetwork: Record<string, number>;
      recentActivity: Record<string, number>;
    };
  };
}

interface FetchOrdersParams {
  ordering?: string;
  status?: string;
  token?: string;
  network?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface Recipient {
  institution: string;
  accountIdentifier: string;
  accountName: string;
  memo: string;
  providerId?: string;
}

interface PaymentOrderPayload {
  amount: number;
  rate: number;
  network: string;
  token: string;
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

interface NetworkErrorDetails {
  code: string;
  message: string;
  details?: {
    errno?: number;
    syscall?: string;
    address?: string;
    port?: number;
  };
}

export async function initiatePaymentOrder(payload: PaymentOrderPayload): Promise<PaymentOrderResponse> {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds

  async function makeRequest(retryCount = 0): Promise<PaymentOrderResponse> {
    try {
      console.log('Attempting to initiate PayCrest order with payload:', {
        payload,
        retry: retryCount + 1
      });
      
      const response = await axios.post(`${PAYCREST_API_URL}/v1/sender/orders`, payload, { 
        headers,
        timeout: 10000, // 10 second timeout
        validateStatus: (status) => true,
        maxRedirects: 5
      });

      if (response.status >= 400) {
        console.error('PayCrest API error response:', {
          status: response.status,
          data: response.data
        });
        throw new Error(`PayCrest API error: ${response.status} - ${JSON.stringify(response.data)}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const networkError = extractNetworkError(error);
        console.error('Network error details:', networkError);

        if (retryCount < MAX_RETRIES && isRetryableError(error)) {
          console.log(`Retrying request (${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return makeRequest(retryCount + 1);
        }

        throw new Error(`Network error: ${networkError.message}. Details: ${JSON.stringify(networkError.details)}`);
      }

      console.error('Error in initiatePaymentOrder:', {
        error,
        errorType: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }

  return makeRequest();
}

function extractNetworkError(error: any): NetworkErrorDetails {
  if (!error.response) {
    const details = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      details: {
        errno: error.errno,
        syscall: error.syscall,
        address: error.address,
        port: error.port
      }
    };
    return details;
  }
  
  return {
    code: error.response.status.toString(),
    message: error.response.statusText,
    details: {
      errno: error.errno,
      syscall: error.syscall,
      address: error.address,
      port: error.port
    }
  };
}

function isRetryableError(error: any): boolean {
  if (!axios.isAxiosError(error)) return false;
  
  const retryableCodes = ['ETIMEDOUT', 'ENETUNREACH', 'ECONNRESET', 'ECONNREFUSED'];
  return retryableCodes.includes(error.code as string);
}


export async function fetchTokenRate(token: string, amount: number, fiat: string, network?: string, providerId?: string): Promise<string> {
  const query = network ? `network=${network}` : '';
  const response = await axios.get(`${PAYCREST_API_URL}/v1/rates/${token}/${amount}/${fiat}?${query}`, { headers });
  return response.data.data;
}

export async function verifyAccount(institution: string, accountIdentifier: string): Promise<string> {
  const response = await axios.post(
    `${PAYCREST_API_URL}/v1/verify-account`,
    { institution, accountIdentifier },
    { headers }
  );
  console.log("response account", response.data.data); //debugging
  return response.data.data;
}

export async function fetchSupportedInstitutions(currencyCode: string): Promise<Array<{ name: string; code: string; type: string }>> {
  const response = await axios.get(`${PAYCREST_API_URL}/v1/institutions/${currencyCode}`, { headers });
  // console.log(response.data.data);
  return response.data.data;
}

export async function fetchSupportedCurrencies(): Promise<Array<{ code: string; name: string; shortName: string; decimals: number; symbol: string; marketRate: string }>> {
  const response = await axios.get(`${PAYCREST_API_URL}/v1/currencies`, { headers });
  return response.data.data;
}

export async function fetchAllOrders(params: FetchOrdersParams = {}): Promise<FetchOrdersResponse> {
  try {
    const queryParams = new URLSearchParams();
    
    // Add pagination params if provided
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    
    // Add other filters if provided
    if (params.status) queryParams.append('status', params.status);
    if (params.token) queryParams.append('token', params.token);
    if (params.network) queryParams.append('network', params.network);
    if (params.ordering) queryParams.append('ordering', params.ordering);
    if (params.search) queryParams.append('search', params.search);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    
    const queryString = queryParams.toString();
    const url = `${PAYCREST_API_URL}/v1/sender/orders${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json(); 
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders: ' + (error instanceof Error ? error.message : 'An unexpected error occurred'));
  }
}