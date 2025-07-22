import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { ChainConfig } from './constants';
import { TOKEN_ADDRESSES, TOKEN_ABI } from './tokenConfig';

type TokenSymbol = keyof typeof TOKEN_ADDRESSES;
type ChainId = keyof typeof TOKEN_ADDRESSES[TokenSymbol];

// Add type guard to ensure token is a valid key
const isValidToken = (token: string): token is TokenSymbol => {
  return token in TOKEN_ADDRESSES;
};

type Balances = Record<number, Record<string, string>>;

export const useBalances = (chains: ChainConfig[], userAddress: string) => {
  const [balances, setBalances] = useState<Balances>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      const newBalances: Balances = {};
      
      for (const chain of chains) {
        newBalances[chain.id] = {};
        
        for (const token of chain.tokens) {
          try {
            if (!isValidToken(token)) {
              newBalances[chain.id][token] = '0';
              continue;
            }
            
            const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrl);
            const address = TOKEN_ADDRESSES[token as TokenSymbol][chain.id as ChainId];
            
            if (!address) {
              newBalances[chain.id][token] = '0';
              continue;
            }
            
            const contract = new ethers.Contract(address, TOKEN_ABI, provider);
            const decimals = await contract.decimals();
            const balance = await contract.balanceOf(userAddress);
            
            newBalances[chain.id][token] = ethers.utils.formatUnits(balance, decimals);
          } catch (err) {
            console.error(`Failed to fetch ${token} balance on ${chain.name}:`, err);
            newBalances[chain.id][token] = '0';
          }
        }
      }
      
      setBalances(newBalances);
      setLoading(false);
    };

    fetchBalances();
  }, [chains, userAddress]);

  return { balances, loading };
};