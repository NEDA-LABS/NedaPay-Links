// app/providers/web3-provider.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import Web3Service from './web3-service';

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  web3Service: Web3Service | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  balance: string;
  isLoadingBalance: boolean;
  refetchBalance: () => void;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const { authenticated, user } = usePrivy();
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [web3Service, setWeb3Service] = useState<Web3Service | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [balance, setBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        await web3Provider.send("eth_requestAccounts", []);
        const web3Signer = web3Provider.getSigner();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setIsConnected(true);

        // Initialize Web3Service with user's wallet
        const service = new Web3Service(
          process.env.NEXT_PUBLIC_WALLET_PRIVATE_KEY!, // This should be handled differently for client-side
          process.env.NEXT_PUBLIC_ALCHEMY_API_KEY!
        );
        setWeb3Service(service);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else {
      console.error('MetaMask not found');
    }
  };

  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setWeb3Service(null);
    setIsConnected(false);
    setBalance('0');
  };

  const fetchBalance = async () => {
    if (!signer || !web3Service) return;
    
    setIsLoadingBalance(true);
    try {
      const address = await signer.getAddress();
      const balance = await web3Service.getBalance(address);
      setBalance(balance);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  useEffect(() => {
    if (authenticated && user) {
      connectWallet();
    } else {
      disconnectWallet();
    }
  }, [authenticated, user]);

  useEffect(() => {
    if (isConnected) {
      fetchBalance();
    }
  }, [isConnected]);

  console.log("provider", provider)
  console.log("signer", signer)
  console.log("web3Service", web3Service)
  console.log("isConnected", isConnected)
  console.log("balance", balance)
  console.log("isLoadingBalance", isLoadingBalance)

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        web3Service,
        isConnected,
        connectWallet,
        disconnectWallet,
        balance,
        isLoadingBalance,
        refetchBalance: fetchBalance,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}