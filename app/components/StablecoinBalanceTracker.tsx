import React, { useState, useEffect } from 'react';
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from 'ethers';
import { stablecoins } from '../data/stablecoins';
import { X } from 'lucide-react';

interface StablecoinBalances {
  [token: string]: number;
}

interface ExchangeRates {
  [currency: string]: number;
}

interface StablecoinBalanceTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const StablecoinBalanceTracker = ({ isOpen, onClose }: StablecoinBalanceTrackerProps) => {
  const { user, authenticated } = usePrivy();
  const [balances, setBalances] = useState<StablecoinBalances>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [totalBalance, setTotalBalance] = useState(0);

  const address = user?.wallet?.address;

  // Available currencies for conversion
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

  // Fetch exchange rates from a free API
  const fetchExchangeRates = async () => {
    try {
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/USD`);
      const data = await response.json();
      setExchangeRates(data.rates);
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Fallback rates if API fails
      setExchangeRates({
        USD: 1,
        EUR: 0.85,
        GBP: 0.73,
        TZS: 2300,
        NGN: 470,
        ZAR: 18.5,
        IDR: 15000,
        CAD: 1.35,
        BRL: 5.2,
        TRY: 27,
        NZD: 1.65,
        MXN: 18
      });
    }
  };

  // Fetch balance for a specific token
  const fetchTokenBalance = async (tokenAddress: string, decimals = 18) => {
    if (!address || !window.ethereum) return '0';
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
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
  const fetchAllBalances = async () => {
    if (!address || !authenticated) return;
    
    setLoading(true);
    const newBalances: StablecoinBalances = {};
    
    for (const coin of stablecoins) {
      const balance = await fetchTokenBalance(coin.address, coin.decimals || 18);
      newBalances[coin.baseToken] = parseFloat(balance);
    }
    
    setBalances(newBalances);
    setLoading(false);
  };

  // Calculate total balance in selected currency
  const calculateTotalBalance = () => {
    let total = 0;
    
    stablecoins.forEach(coin => {
      const balance = balances[coin.baseToken] || 0;
      if (balance > 0) {
        // Convert from stablecoin's native currency to selected currency
        const nativeRate = exchangeRates[coin.currency] || 1;
        const selectedRate = exchangeRates[selectedCurrency] || 1;
        const convertedBalance = (balance / nativeRate) * selectedRate;
        total += convertedBalance;
      }
    });
    
    setTotalBalance(total);
  };

  // Convert amount from one currency to another
  const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string) => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;
    
    const usdAmount = amount / exchangeRates[fromCurrency];
    return usdAmount * exchangeRates[toCurrency];
  };

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  // Handle swap button click
  const handleSwap = (tokenSymbol: string) => {
    setSelectedToken(tokenSymbol);
    setSwapModalOpen(true);
  };

  // Initialize data
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  useEffect(() => {
    if (authenticated && address) {
      fetchAllBalances();
    }
  }, [authenticated, address]);

  useEffect(() => {
    calculateTotalBalance();
  }, [balances, exchangeRates, selectedCurrency]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && address) {
        fetchAllBalances();
      }
      fetchExchangeRates();
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticated, address]);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-gray-600">Please connect your wallet to view your stablecoin balances</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-6">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div className='flex justify-between w-full'>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Stablecoin Portfolio</h1>
                <p className="text-gray-600">Track your stablecoin balances across different currencies</p>
              </div>
              <button onClick={onClose} className='ml-auto'>
                <X className='hover:text-red-500'/>
              </button>
            </div>
            
            <div className="mt-4 md:mt-0 flex">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {currencies.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  fetchAllBalances();
                  fetchExchangeRates();
                }}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-6 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium opacity-90 mb-1">Total Portfolio Value</h2>
              <div className="text-4xl font-bold">
                {getCurrencySymbol(selectedCurrency)}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
              </div>
              <p className="text-sm opacity-75 mt-1">
                Across {Object.values(balances).filter(b => b > 0).length} stablecoins
              </p>
            </div>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        {/* Stablecoin Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stablecoins.map((coin) => {
            const balance = balances[coin.baseToken] || 0;
            const convertedBalance = convertCurrency(balance, coin.currency, selectedCurrency);
            const hasBalance = balance > 0;

            return (
              <div
                key={coin.baseToken}
                className={`bg-white rounded-xl shadow-lg border-2 transition-all duration-200 ${
                  hasBalance 
                    ? 'border-green-200 shadow-green-100' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{coin.flag}</div>
                      <div>
                        <h3 className="font-bold text-gray-900">{coin.baseToken}</h3>
                        <p className="text-sm text-gray-500">{coin.name}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      hasBalance 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {coin.currency}
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {loading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                      ) : (
                        <>
                          {balance.toLocaleString(undefined, { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 6 
                          })} {coin.baseToken}
                        </>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      ≈ {getCurrencySymbol(selectedCurrency)}{convertedBalance.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 8 
                      })}
                    </div>
                  </div>

                  {/* Token Info */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Issuer:</span>
                      <span className="font-medium">{coin.issuer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Pegged to:</span>
                      <span className="font-medium">{coin.currency}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleSwap(coin.baseToken)}
                      disabled={!hasBalance}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        hasBalance
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        <span>Swap</span>
                      </div>
                    </button>
                    <a
                      href={coin.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        <span>Info</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Stats */}
        <div className="bg-white rounded-2xl shadow-xl mt-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stablecoins.length}
              </div>
              <div className="text-sm text-gray-600">Total Stablecoins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(balances).filter(b => b > 0).length}
              </div>
              <div className="text-sm text-gray-600">With Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Set(stablecoins.map(c => c.currency)).size}
              </div>
              <div className="text-sm text-gray-600">Currencies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Wallet Address</div>
            </div>
          </div>
        </div>

        {/* Simple Swap Modal */}
        {swapModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Swap {selectedToken}</h3>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">
                  Swap functionality would integrate with your existing SwapModal component.
                </p>
                <button
                  onClick={() => setSwapModalOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StablecoinBalanceTracker;