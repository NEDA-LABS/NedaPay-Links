import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from 'ethers';
import { stablecoins } from '../data/stablecoins';

interface StablecoinBalances {
  [token: string]: number;
}

interface ExchangeRates {
  [currency: string]: number;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzania Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' }
];

const MiniBalanceTracker = () => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [balances, setBalances] = useState<StablecoinBalances>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const address = user?.wallet?.address;

  // Check for Web3 provider availability
  const checkWeb3Provider = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    try {
      let provider;
      if (authenticated && address && wallets) {
        const embeddedWallet = wallets.find(wallet => 
          wallet.walletClientType === 'privy' && wallet.address === address
        );
        if (embeddedWallet) {
          const privyProvider = await embeddedWallet.getEthereumProvider();
          if (privyProvider) {
            provider = new ethers.providers.Web3Provider(privyProvider);
          }
        }
      }
      if (!provider && window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
      }
      setWalletProvider(provider);
      return provider;
    } catch (error) {
      console.error('Error checking Web3 provider:', error);
      return null;
    }
  }, [authenticated, address, wallets]);

  // Fetch exchange rates
  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      const filteredRates: ExchangeRates = {};
      currencies.forEach(currency => {
        if (data.rates[currency.code]) {
          filteredRates[currency.code] = data.rates[currency.code];
        }
      });
      filteredRates['USD'] = 1;
      setExchangeRates(filteredRates);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      setExchangeRates({ USD: 1 });
    }
  };

  // Fetch token balance
  const fetchTokenBalance = async (tokenAddress: string, decimals = 18, provider: any) => {
    if (!address || !provider) return '0';
    try {
      const contract = new ethers.Contract(
        tokenAddress,
        ["function balanceOf(address owner) view returns (uint256)"],
        provider
      );
      const balance = await contract.balanceOf(address);
      return ethers.utils.formatUnits(balance, decimals);
    } catch (error) {
      console.error(`Error fetching balance for ${tokenAddress}:`, error);
      return '0';
    }
  };

  // Fetch all stablecoin balances
  const fetchAllBalances = useCallback(async () => {
    if (!address || !authenticated) return;
    setLoading(true);
    const provider = await checkWeb3Provider();
    if (!provider) {
      setLoading(false);
      return;
    }
    const newBalances: StablecoinBalances = {};
    for (const coin of stablecoins) {
      try {
        const balance = await fetchTokenBalance(coin.address, coin.decimals || 18, provider);
        newBalances[coin.baseToken] = parseFloat(balance);
      } catch (error) {
        newBalances[coin.baseToken] = 0;
      }
    }
    setBalances(newBalances);
    setLoading(false);
  }, [address, authenticated, checkWeb3Provider]);

  // Calculate total balance
  const calculateTotalBalance = () => {
    let total = 0;
    stablecoins.forEach(coin => {
      const balance = balances[coin.baseToken] || 0;
      if (balance > 0) {
        const fromRate = exchangeRates[coin.currency] || 1;
        const toRate = exchangeRates[selectedCurrency] || 1;
        const usdAmount = balance / fromRate;
        const convertedBalance = usdAmount * toRate;
        total += convertedBalance;
      }
    });
    setTotalBalance(total);
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  // Initialize data
  useEffect(() => {
    fetchExchangeRates();
    checkWeb3Provider();
  }, [checkWeb3Provider]);

  useEffect(() => {
    if (authenticated && address) {
      fetchAllBalances();
    }
  }, [authenticated, address, fetchAllBalances]);

  useEffect(() => {
    calculateTotalBalance();
  }, [balances, exchangeRates, selectedCurrency]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && address && walletProvider) {
        fetchAllBalances();
        fetchExchangeRates();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [authenticated, address, walletProvider, fetchAllBalances]);

  return (
    <div className="inline-flex items-center bg-white rounded-full shadow-md border border-gray-200 p-2 space-x-2">
      <div className="text-sm font-semibold text-gray-900">
        {loading ? (
          <span>Loading...</span>
        ) : (
          <span>
            {getCurrencySymbol(selectedCurrency)}
            {totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
      <select
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value)}
        className="text-sm bg-transparent border-none focus:ring-0 p-1"
      >
        {currencies.map(currency => (
          <option key={currency.code} value={currency.code}>
            {currency.code}
          </option>
        ))}
      </select>
    </div>
  );
};

export default MiniBalanceTracker;