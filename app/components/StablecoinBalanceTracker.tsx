import React, { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from 'ethers';
import { stablecoins } from '../data/stablecoins';
import { SUPPORTED_CHAINS } from '@/offramp/offrampHooks/constants';
import { X, AlertCircle, Wallet, Loader2, ChevronRight } from 'lucide-react';

// Define type for supported chain IDs
type ChainId = 8453 | 42161 | 137 | 42220 | 56;

interface Chain {
  id: number;
  name: string;
  rpcUrl?: string;
}

interface StablecoinBalances {
  [token: string]: number;
}

interface ExchangeRates {
  [currency: string]: number;
}

interface StablecoinBalanceTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  setTotalBalance: React.Dispatch<React.SetStateAction<number>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const StablecoinBalanceTracker = ({ 
  isOpen, 
  onClose,
  setTotalBalance,
  setLoading: setParentLoading
}: StablecoinBalanceTrackerProps) => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);
  const [balances, setBalances] = useState<StablecoinBalances>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);

  // Get wallet address - prioritize embedded wallet, fallback to connected wallet
  const getWalletAddress = useCallback(() => {
    if (user?.wallet?.address) {
      return user.wallet.address;
    }
    
    // Fallback to any connected wallet
    const connectedWallet = wallets?.find(w => w.address);
    return connectedWallet?.address || null;
  }, [user, wallets]);

  const address = getWalletAddress();

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

  // Initialize provider for current chain
  const initializeProvider = useCallback(async () => {
    if (!authenticated || !address || wallets.length === 0) {
      setCurrentChain(null);
      setErrors(['Authentication or wallet not available']);
      return;
    }

    const errorList: string[] = [];
    let newProvider: ethers.providers.Provider | null = null;
    const wallet = wallets[0];
    
    try {
      // Extract chain ID from wallet (format: "eip155:42161")
      const chainIdHex = wallet.chainId.split(':')[1];
      const chainId = parseInt(chainIdHex, 10);
      
      // Find matching chain from supported chains
      const matchedChain = SUPPORTED_CHAINS.find(c => c.id === chainId) || null;
      setCurrentChain(matchedChain);
      
      if (!matchedChain) {
        setErrors([`Chain ID ${chainId} not supported`]);
        return;
      }

      const embeddedWallet = wallets.find(wallet => 
        wallet.walletClientType === 'privy' && wallet.address === address
      );

      if (embeddedWallet) {
        try {
          const privyEthereumProvider = await embeddedWallet.getEthereumProvider();
          if (privyEthereumProvider) {
            newProvider = new ethers.providers.Web3Provider(privyEthereumProvider);
            await newProvider.getBlockNumber();
          }
        } catch (error) {
          console.log('Failed to get Privy provider:', error);
          errorList.push('Failed to initialize Privy provider');
        }
      }

      // Fallback to external wallet
      if (!newProvider && typeof window !== 'undefined' && window.ethereum) {
        try {
          newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await (newProvider as ethers.providers.Web3Provider).listAccounts();
          if (accounts.length === 0) {
            await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
          }
          await newProvider.getBlockNumber();
        } catch (error) {
          console.error('Failed to initialize external provider:', error);
          errorList.push('Failed to connect to external wallet');
        }
      }

      if (!newProvider && matchedChain.rpcUrl) {
        try {
          newProvider = new ethers.providers.JsonRpcProvider(matchedChain.rpcUrl);
          await newProvider.getBlockNumber();
        } catch (error) {
          console.error('Failed to initialize RPC provider:', error);
          errorList.push(`Failed to connect to chain ${matchedChain.id} via RPC`);
        }
      }

      setProvider(newProvider);
      setErrors(errorList);
      
    } catch (error) {
      console.error('Error initializing provider:', error);
      setErrors(['Failed to initialize blockchain connection']);
    }
  }, [authenticated, address, wallets]);

  // Fetch exchange rates from a free API
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

  // Fetch balance for a specific token on the current chain
  const fetchTokenBalance = async (
    tokenAddress: string, 
    decimals: number = 18, 
    provider: ethers.providers.Provider,
    walletAddress: string
  ): Promise<string> => {
    try {
      if (tokenAddress === ethers.constants.AddressZero) {
        // Native token
        const balance = await provider.getBalance(walletAddress);
        return ethers.utils.formatUnits(balance, decimals);
      } else {
        // ERC-20 token
        const contract = new ethers.Contract(
          tokenAddress,
          [
            "function balanceOf(address owner) view returns (uint256)",
            "function decimals() view returns (uint8)"
          ],
          provider
        );

        const balance = await contract.balanceOf(walletAddress);
        
        let tokenDecimals = decimals;
        if (decimals === 18) {
          try {
            tokenDecimals = await contract.decimals();
          } catch (error) {
            tokenDecimals = decimals;
          }
        }
        
        return ethers.utils.formatUnits(balance, tokenDecimals);
      }
    } catch (error) {
      console.error(`Error fetching balance for ${tokenAddress}:`, error);
      return '0';
    }
  };

  // Fetch all stablecoin balances for current chain
  const fetchAllBalances = useCallback(async () => {
    if (!address || !authenticated || !provider || !currentChain) {
      console.log('No address, not authenticated, or no provider/chain');
      return;
    }

    setLoading(true);
    setErrors([]);

    const newBalances: StablecoinBalances = {};
    const errorList: string[] = [];

    const balancePromises: Promise<{ token: string; balance: number }>[] = [];

    stablecoins.forEach((coin) => {
      if (!coin.chainIds.includes(currentChain.id)) return;
      
      const tokenAddress = (coin.addresses as Record<string, string | undefined>)[currentChain.id.toString()];
      if (!tokenAddress) return;

      const promise = (async () => {
        try {
          let decimals = 18;
          if (typeof coin.decimals === 'number') {
            decimals = coin.decimals;
          } else if (typeof coin.decimals === 'object' && (currentChain.id as ChainId) in coin.decimals) {
            decimals = coin.decimals[currentChain.id as ChainId];
          }

          const balance = await fetchTokenBalance(
            tokenAddress,
            decimals,
            provider,
            address
          );
          
          return { token: coin.baseToken, balance: parseFloat(balance) };
        } catch (error) {
          console.error(`Failed to fetch ${coin.baseToken} balance on chain ${currentChain.id}:`, error);
          errorList.push(`Failed to fetch ${coin.baseToken} balance`);
          return { token: coin.baseToken, balance: 0 };
        }
      })();

      balancePromises.push(promise);
    });

    try {
      const results = await Promise.allSettled(balancePromises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { token, balance } = result.value;
          newBalances[token] = balance;
        }
      });

      setBalances(newBalances);
      setErrors(errorList);
      
    } catch (error) {
      console.error('Error fetching balances:', error);
      setErrors(['Failed to fetch token balances']);
    } finally {
      setLoading(false);
    }
  }, [address, authenticated, provider, currentChain]);

  // Calculate total balance in selected currency
  const calculateTotalBalance = useCallback(() => {
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
    return total;
  }, [balances, exchangeRates, selectedCurrency]);

  // Convert amount from one currency to another
  const convertCurrency = useCallback((amount: number, fromCurrency: string, toCurrency: string) => {
    if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency]) return amount;

    const usdAmount = amount / exchangeRates[fromCurrency];
    return usdAmount * exchangeRates[toCurrency];
  }, [exchangeRates]);

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

  // Listen for wallet chain changes
  useEffect(() => {
    if (wallets.length > 0) {
      initializeProvider();
    }
  }, [wallets[0]?.chainId, initializeProvider]);

  // Update chain info when wallets change
  useEffect(() => {
    if (wallets.length > 0 && wallets[0]?.chainId) {
      const chainIdHex = wallets[0].chainId.split(':')[1];
      const chainId = parseInt(chainIdHex, 10);
      const matchedChain = SUPPORTED_CHAINS.find(c => c.id === chainId) || null;
      setCurrentChain(matchedChain);
    } else {
      setCurrentChain(null);
    }
  }, [wallets]);

  // Fetch balances when provider is ready
  useEffect(() => {
    if (authenticated && address && provider && currentChain) {
      fetchAllBalances();
    }
  }, [authenticated, address, provider, currentChain, fetchAllBalances]);

  // Recalculate total when balances or rates change  
  useEffect(() => {
    calculateTotalBalance();
  }, [calculateTotalBalance]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && address && provider && currentChain) {
        fetchAllBalances();
        fetchExchangeRates();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticated, address, provider, currentChain, fetchAllBalances]);

  // Update parent loading state
  useEffect(() => {
    setParentLoading(loading);
  }, [loading, setParentLoading]);

  if (!isOpen) return null;

  if (!authenticated) {
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="min-h-[80vh] w-full max-w-4xl bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-white rounded-2xl p-8 relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-slate-800" />
            </button>
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
              <p className="text-gray-600">Please connect your wallet to view your stablecoin balances</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="min-h-[80vh] w-full max-w-6xl bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl shadow-xl">
        <div className="h-full overflow-auto">
          {/* Header */}
          <div className="bg-white p-6 sticky top-0 z-10 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className='flex justify-between w-full'>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 mb-2">Stablecoin Portfolio</h1>
                  <p className="text-gray-600">Track your stablecoin balances across different currencies</p>
                </div>
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-2">
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800"
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
                <button onClick={onClose} className='ml-auto'>
                  <X className='hover:text-red-500 text-slate-800'/>
                </button>
              </div>
            </div>
          </div>

          {/* Total Balance Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium opacity-90 mb-1">Total Portfolio Value</h2>
                {loading ? (
                  <div className="flex items-center justify-center text-lg font-bold">
                    <Loader2 className="animate-spin h-8 w-8 mr-2" />
                    Loading...
                  </div>
                ) : (
                  <div>
                    <div className="text-lg font-bold">
                      {getCurrencySymbol(selectedCurrency)}{calculateTotalBalance().toFixed(2)}
                    </div>
                    <p className="text-sm opacity-75 mt-1">
                      Across {Object.values(balances).filter(b => b > 0).length} stablecoins
                    </p>
                  </div>
                )}
              </div>
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Stablecoin Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {stablecoins.map((coin) => {
              if (!currentChain || !coin.chainIds.includes(currentChain.id)) return null;
              
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
          <div className="bg-white rounded-2xl shadow-xl m-6 p-6">
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
                    <X className="w-6 h-6" />
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
    </div>
  );
};

export const StablecoinBalanceButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  
  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setModalOpen(true)}
        className="z-40 hover:bg-blue-700 text-white font-medium px-4 rounded-full flex items-center space-x-2 transition-all"
      >
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5" />
        ) : (
          <span>${totalBalance.toFixed(2)}</span>
        )}
        <span>Balance</span>
        <ChevronRight className="h-4 w-4" />
      </button>

      {/* Modal */}
      <StablecoinBalanceTracker 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        setTotalBalance={setTotalBalance}
        setLoading={setLoading}
      />
    </>
  );
};