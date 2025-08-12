"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "../data/stablecoins";
import { SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { X, AlertCircle, Wallet, Loader2, ChevronRight, Repeat, RefreshCw } from "lucide-react";
import SwapModal from "./SwapModal";
import { Button } from "@/components/Button"; 
import Image from "next/image";

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
      <button 
        onClick={() => setModalOpen(true)}
        className="z-40 bg-white/5 rounded-xl border border-white/20 text-center text-sm text-white font-medium p-2 hover:bg-white/10 flex items-center space-x-2 transition-all"
      >
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5" />
        ) : (
          <span>${totalBalance.toFixed(2)}</span>
        )}
      </button>

      <StablecoinBalanceTracker
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        setTotalBalance={setTotalBalance}
        setLoading={setLoading}
      />
    </>
  );
};