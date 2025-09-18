'use client';

import { useQuery } from '@tanstack/react-query';
import type { ChainConfig } from '../utils/chains';
import type { TokenSymbol } from '../utils/tokens';

interface RateResponse {
  statusCode: number;
  message: string;
  data: {
    price: string;
    buyAmount: string;
    chainId: number;
  };
}

interface UseRatesParams {
  chain: ChainConfig;
  token: TokenSymbol;
  amount?: string;
}

/**
 * Hook to fetch current exchange rates from IDRXCO API
 * Returns the current rate for converting tokens to IDR
 */
export const useRates = ({ chain, token, amount }: UseRatesParams) => {
  const {
    data: rateData,
    isLoading,
    error,
    refetch,
  } = useQuery<RateResponse>({
    queryKey: ['rates', chain.id, token, amount],
    queryFn: async () => {
      const params = new URLSearchParams({
        chainId: chain.id.toString(),
        token: token,
        ...(amount && { amount }),
      });
      
      console.log('🔄 useRates fetching with params:', { chain: chain.id, token, amount });
      
      const response = await fetch(`/api/idrxco/rates?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch rates');
      }
      
      const data = await response.json();
      console.log('📊 useRates received data:', data);
      
      return data;
    },
    enabled: !!chain && !!token,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });

  // Calculate the rate based on the API response
  // IDRX has a 1:1 peg with IDR, other tokens use market rates
  let rate = 1;
  
  if (rateData?.data) {
    const { price, buyAmount } = rateData.data;
    const inputAmount = amount ? parseFloat(amount) : 1;
    
    if (token.toUpperCase() === 'IDRX') {
      // IDRX is pegged 1:1 with IDR
      rate = 1;
      console.log('💱 IDRX rate (1:1 peg):', rate);
    } else if (buyAmount && inputAmount > 0) {
      // For other tokens, calculate rate from API response
      // Rate = IDR amount / input token amount
      rate = parseFloat(buyAmount) / inputAmount;
      console.log('💱 Market rate calculated:', { inputAmount, buyAmount, finalRate: rate });
    } else if (price) {
      // Fallback to using price field (might need inversion)
      const priceNum = parseFloat(price);
      rate = priceNum < 1 ? 1 / priceNum : priceNum;
      console.log('💱 Fallback rate from price:', { price, finalRate: rate });
    }
    
    console.log('💱 Final rate for', token, ':', rate);
  }
  
  const buyAmount = rateData?.data?.buyAmount ? parseFloat(rateData.data.buyAmount) : 0;

  return {
    rate,
    buyAmount,
    isLoading,
    error,
    refetch,
    rawData: rateData,
  };
};
