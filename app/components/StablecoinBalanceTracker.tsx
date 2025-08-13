"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "../data/stablecoins";
import { SUPPORTED_CHAINS } from "@/data/platformSupportedChains";
import { X, AlertCircle, Wallet, Loader2, ChevronRight, Repeat, RefreshCw } from "lucide-react";
import SwapModal from "./SwapModal";
import { Button } from "@/components/Button"; 
import Image from "next/image";
import ChainSwitcher from "@/components/ChainSwitcher";
import WalletKit from "@/dashboard/WalletKit";

type ChainId = 8453 | 42161 | 137 | 42220 | 56 | 534352 | 10;

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

export const StablecoinBalanceTracker = ({
  isOpen,
  onClose,
  setTotalBalance,
  setLoading: setParentLoading,
}: StablecoinBalanceTrackerProps) => {
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const [currentChain, setCurrentChain] = useState<Chain | null>(null);
  const [balances, setBalances] = useState<StablecoinBalances>({});
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const address = wallets[0]?.address || null;

  const currencies = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "TZS", symbol: "TSh", name: "Tanzania Shilling" },
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
  ];

  const initializeProvider = useCallback(async () => {
    if (!authenticated || !address || wallets.length === 0) {
      setCurrentChain(null);
      setErrors(["Authentication or wallet not available"]);
      return;
    }

    setErrors([]);
    const wallet = wallets[0];
    
    try {
      const chainId = wallet.chainId.split(":")[1];
      const chainIdNum = parseInt(chainId, 10);
      
      const matchedChain = SUPPORTED_CHAINS.find(c => c.id === chainIdNum) || null;
      setCurrentChain(matchedChain);

      if (!matchedChain) {
        setErrors([`Chain ID ${chainIdNum} not supported`]);
        return;
      }

      // Use Privy's provider directly
      const ethereumProvider = await wallet.getEthereumProvider();
      const newProvider = new ethers.providers.Web3Provider(ethereumProvider);
      
      setProvider(newProvider);
    } catch (error) {
      console.error("Error initializing provider:", error);
      setErrors(["Failed to initialize blockchain connection"]);
      if (retryCount < 3) {
        setTimeout(() => setRetryCount(c => c + 1), 2000);
      }
    }
  }, [authenticated, address, wallets, retryCount]);

  const fetchExchangeRates = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const data = await response.json();

      const filteredRates: ExchangeRates = {};
      currencies.forEach((currency) => {
        if (data.rates[currency.code]) {
          filteredRates[currency.code] = data.rates[currency.code];
        }
      });

      filteredRates["USD"] = 1;
      setExchangeRates(filteredRates);
    } catch (error) {
      console.error("Failed to fetch exchange rates:", error);
      setExchangeRates({ USD: 1 });
    }
  }, [currencies]);

  const fetchAllBalances = useCallback(async () => {
    if (!address || !authenticated || !provider || !currentChain) return;

    setLoading(true);
    setErrors([]);

    try {
      const newBalances: StablecoinBalances = {};
      const contractCalls = [];
      const contracts = [];

      for (const coin of stablecoins) {
        if (!coin.chainIds.includes(currentChain.id)) continue;

        const tokenAddress = (coin.addresses as Record<string, string | undefined>)[currentChain.id.toString()];
        if (!tokenAddress) continue;

        let decimals = 18;
        if (typeof coin.decimals === "number") {
          decimals = coin.decimals;
        } else if (typeof coin.decimals === "object" && (currentChain.id as ChainId) in coin.decimals) {
          decimals = coin.decimals[currentChain.id as keyof typeof coin.decimals];
        }

        if (tokenAddress === ethers.constants.AddressZero) {
          contractCalls.push(provider.getBalance(address));
        } else {
          const contract = new ethers.Contract(
            tokenAddress,
            ["function balanceOf(address) view returns (uint256)"],
            provider
          );
          contracts.push(contract);
          contractCalls.push(contract.balanceOf(address));
        }
      }

      const results = await Promise.allSettled(contractCalls);

      let index = 0;
      for (const coin of stablecoins) {
        if (!coin.chainIds.includes(currentChain.id)) continue;
        
        const tokenAddress = (coin.addresses as Record<string, string | undefined>)[currentChain.id.toString()];
        if (!tokenAddress) continue;

        let decimals = 18;
        if (typeof coin.decimals === "number") {
          decimals = coin.decimals;
        } else if (typeof coin.decimals === "object" && (currentChain.id as ChainId) in coin.decimals) {
          decimals = coin.decimals[currentChain.id as keyof typeof coin.decimals];
        }

        const result = results[index++];
        if (result.status === "fulfilled") {
          const balance = ethers.utils.formatUnits(result.value, decimals);
          newBalances[coin.baseToken] = parseFloat(balance);
        }
      }

      setBalances(newBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setErrors(["Failed to fetch token balances"]);
      if (retryCount < 3) {
        setTimeout(() => setRetryCount(c => c + 1), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [address, authenticated, provider, currentChain, retryCount]);

  const calculateTotalBalance = useCallback(() => {
    let total = 0;

    stablecoins.forEach((coin) => {
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

  const convertCurrency = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency])
        return amount;

      const usdAmount = amount / exchangeRates[fromCurrency];
      return usdAmount * exchangeRates[toCurrency];
    },
    [exchangeRates]
  );

  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
    return currency ? currency.symbol : currencyCode;
  };

  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  useEffect(() => {
    fetchExchangeRates();
  }, [fetchExchangeRates]);

  useEffect(() => {
    if (retryCount > 0) {
      initializeProvider();
    }
  }, [retryCount, initializeProvider]);

  useEffect(() => {
    if (wallets.length > 0) {
      initializeProvider();
    }
  }, [wallets[0]?.chainId, initializeProvider]);

  useEffect(() => {
    if (authenticated && address && provider && currentChain) {
      fetchAllBalances();
    }
  }, [authenticated, address, provider, currentChain, fetchAllBalances]);

  useEffect(() => {
    calculateTotalBalance();
  }, [calculateTotalBalance]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (authenticated && address && provider && currentChain) {
        fetchAllBalances();
        fetchExchangeRates();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [authenticated, address, provider, currentChain, fetchAllBalances, fetchExchangeRates]);

  useEffect(() => {
    setParentLoading(loading);
  }, [loading, setParentLoading]);

  if (!isOpen) return null;

  return (
    <div className="z-50 flex items-center justify-center md:p-4 overflow-auto rounded-2xl w-full">
      <div className="max-w-6xl bg-gray-800 rounded-2xl shadow-xl w-[95%] mx-auto">
        <div className="h-full overflow-auto"> 
          <div className="p-6 sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="mt-4 md:mt-0 flex space-x-2">
                {wallets[0]?.walletClientType === "coinbase_wallet" && loading && (
                  <div className="flex items-center text-yellow-500 text-sm">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Coinbase may take longer to respond...
                  </div>
                )}
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Stablecoins</h3>
          
          {errors.length > 0 && (
            <div className="p-3 bg-red-900/30 rounded-lg mx-4 mb-4">
              {errors.map((err, i) => (
                <div key={i} className="text-red-400 text-sm flex items-center">
                  <AlertCircle className="mr-2 h-4 w-4" /> {err}
                </div>
              ))}
              <Button 
                size="sm" 
                className="mt-2"
                onClick={() => setRetryCount(c => c + 1)}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 md:gap-3 p-4">
            {stablecoins.map((coin) => {
              if (!currentChain || !coin.chainIds.includes(currentChain.id))
                return null;

              const balance = balances[coin.baseToken] || 0;
              const convertedBalance = convertCurrency(
                balance,
                coin.currency,
                selectedCurrency
              );
              const hasBalance = balance > 0;

              return (
                <div
                  key={coin.baseToken}
                  className={`rounded-xl border transition-all p-3 flex items-center justify-between shadow-sm ${
                    hasBalance
                      ? "bg-gradient-to-b from-[#1e293b] to-[#0f172a] border-green-500/40"
                      : "bg-[#0f172a] border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3"> 
                    <Image src={coin.flag} alt={coin.name} width={24} height={24} className="text-2xl rounded-full"/>
                    <div>
                      <div className="text-xs md:text-sm font-semibold text-white">
                        {coin.baseToken}
                      </div>
                      <div className="text-xs md:text-sm text-gray-400">
                        ≈ {getCurrencySymbol(selectedCurrency)}
                        {convertedBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs md:text-sm font-bold text-white">
                        {balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <button
                      onClick={() => handleSwapClick(coin.baseToken)}
                      disabled={!hasBalance}
                      className={`p-2 rounded-lg transition ${
                        hasBalance
                          ? "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                          : "bg-gray-800 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <Repeat className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-950/60 rounded-2xl shadow-xl m-6 p-6">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-base font-bold text-white">
                  {stablecoins.length}
                </div>
                <div className="text-sm text-white">Total Stablecoins</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-white">
                  {Object.values(balances).filter((b) => b > 0).length}
                </div>
                <div className="text-sm text-white">With Balance</div>
              </div>
              <div className="text-center">
                <div className="text-base font-bold text-white">
                  {new Set(stablecoins.map((c) => c.currency)).size}
                </div>
                <div className="text-sm text-white">Currencies</div>
              </div>
            </div>
          </div>

          {swapModalOpen && (
            <SwapModal
              open={swapModalOpen}
              fromSymbol={swapFromSymbol}
              onSwap={handleSwapClick}
              onClose={() => setSwapModalOpen(false)}
              maxAmount={balances[swapFromSymbol]?.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })}
            />
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
       <div className="group relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800/60 via-slate-800/40 to-slate-900/60 backdrop-blur-md rounded-3xl"></div>
      
      {/* Subtle Border Glow */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* Main Card */}
      <div 
        className="relative bg-slate-800/30 backdrop-blur-xl rounded-3xl border border-slate-600/30 p-8 hover:bg-slate-800/50 hover:border-slate-500/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer transform hover:scale-[1.02]"
        onClick={() => setModalOpen(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-slate-300 text-lg font-medium tracking-wide">Total Stablecoins Balance</h3>
          </div>
          <ChainSwitcher />
        </div>

        {/* Balance Section */}
        <div className="mb-8 text-center">
          {loading ? (
            <div className="flex items-center justify-center space-x-4">
              <Loader2 className="animate-spin h-10 w-10 text-blue-400" />
              <div className="space-y-2">
                <div className="h-12 bg-gradient-to-r from-slate-700/50 to-slate-600/30 rounded-xl w-48 animate-pulse"></div>
                <div className="h-4 bg-slate-700/30 rounded w-24 mx-auto animate-pulse"></div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent leading-none">
                ${totalBalance.toLocaleString('en-US', { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                })}
              </div>
              <p className="text-slate-400 text-sm font-medium">USD</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4">
          <div className="hover:scale-105 transition-transform duration-200">
            <WalletKit buttonName="Send" />
          </div>
          <div className="w-px h-8 bg-slate-600/50"></div>
          <div className="hover:scale-105 transition-transform duration-200">
            <WalletKit buttonName="Receive" />
          </div>
        </div>

        {/* Subtle Corner Accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-3xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-3xl"></div>
      </div>
    </div>

      <StablecoinBalanceTracker
        isOpen={false}
        onClose={() => setModalOpen(false)}
        setTotalBalance={setTotalBalance}
        setLoading={setLoading}
      />
    </>
  );
};