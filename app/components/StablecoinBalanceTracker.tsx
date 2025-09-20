"use client";
import React, { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "../data/stablecoins";
import { SUPPORTED_CHAINS } from "@/data/platformSupportedChains";
import { X, AlertCircle, Wallet, Loader2, ChevronRight, Repeat, RefreshCw, ChevronDown, DollarSign } from "lucide-react";
import SwapModal from "./SwapModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  const [modalOpen, setModalOpen] = useState(false);
  const [visibleTokensCount, setVisibleTokensCount] = useState(6);

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

  // Get all relevant tokens for current chain
  const relevantTokens = stablecoins.filter((coin) => 
    currentChain && coin.chainIds.includes(currentChain.id)
  );

  // Separate tokens with and without balance
  const tokensWithBalance = relevantTokens.filter((coin) => {
    const balance = balances[coin.baseToken] || 0;
    return balance > 0;
  });

  const tokensWithoutBalance = relevantTokens.filter((coin) => {
    const balance = balances[coin.baseToken] || 0;
    return balance === 0;
  });

  // Show tokens with balance first, then fill remaining space with zero-balance tokens
  const displayTokens = [...tokensWithBalance, ...tokensWithoutBalance.slice(0, Math.max(0, visibleTokensCount - tokensWithBalance.length))];
  const hasMoreTokens = relevantTokens.length > displayTokens.length;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-800/50 hover:border-slate-700/50 transition-all duration-300 h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-white text-center flex items-center justify-between">
          <span>Stablecoins</span>
          <Badge variant="secondary" className="bg-slate-800 text-slate-300">
            {tokensWithBalance.length}/{relevantTokens.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {errors.length > 0 && (
          <div className="p-3 bg-red-900/30 rounded-lg border border-red-800/50">
            {errors.map((err, i) => (
              <div key={i} className="text-red-400 text-sm flex items-center">
                <AlertCircle className="mr-2 h-4 w-4" /> {err}
              </div>
            ))}
            <Button 
              size="sm" 
              variant="outline"
              className="mt-2"
              onClick={() => setRetryCount(c => c + 1)}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        )}

        {/* Stablecoin Flex Layout */}
        <div className="flex flex-wrap gap-3 flex-1 content-start">
          {displayTokens.map((coin) => {
            const balance = balances[coin.baseToken] || 0;
            const convertedBalance = convertCurrency(
              balance,
              coin.currency,
              selectedCurrency
            );
            const hasBalance = balance > 0;

            return (
              <Card
                key={coin.baseToken}
                className={`flex-shrink-0 w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] transition-all duration-200 hover:scale-[1.02] ${
                  hasBalance
                    ? "bg-gradient-to-b from-emerald-900/20 to-slate-900/40 border-emerald-500/30 hover:border-emerald-400/50"
                    : "bg-slate-900/20 border-slate-700/30 hover:border-slate-600/50"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Image 
                        src={coin.flag} 
                        alt={coin.name} 
                        width={18} 
                        height={18} 
                        className="rounded-full"
                      />
                      <div className="text-sm font-medium text-white truncate">
                        {coin.baseToken}
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 text-center">
                      ≈{getCurrencySymbol(selectedCurrency)}{convertedBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Show All Button - Opens Modal */}
        <div className="mt-auto pt-4">
          {(hasMoreTokens || relevantTokens.length > visibleTokensCount) && (
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full text-xs text-slate-400 hover:text-white hover:bg-slate-800/50 border-slate-700 transition-colors"
                >
                  <ChevronDown className="h-4 w-4 mr-2" />
                  View All Stablecoins ({relevantTokens.length} total)
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[80vh] bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white flex items-center justify-between">
                  <span>All Stablecoins</span>
                  <Badge variant="secondary" className="bg-slate-800 text-slate-300">
                    {tokensWithBalance.length}/{relevantTokens.length} Active
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <div className="flex flex-wrap gap-3 p-1">
                  {relevantTokens.map((coin) => {
                    const balance = balances[coin.baseToken] || 0;
                    const convertedBalance = convertCurrency(
                      balance,
                      coin.currency,
                      selectedCurrency
                    );
                    const hasBalance = balance > 0;

                    return (
                      <Card
                        key={coin.baseToken}
                        className={`flex-shrink-0 w-[calc(50%-0.375rem)] md:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)] xl:w-[calc(20%-0.6rem)] transition-all duration-200 hover:scale-[1.02] ${
                          hasBalance
                            ? "bg-gradient-to-b from-emerald-900/20 to-slate-900/40 border-emerald-500/30 hover:border-emerald-400/50"
                            : "bg-slate-900/20 border-slate-700/30 hover:border-slate-600/50"
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Image 
                              src={coin.flag} 
                              alt={coin.name} 
                              width={20} 
                              height={20} 
                              className="rounded-full"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-white truncate">
                                {coin.baseToken}
                              </div>
                              {hasBalance && (
                                <Badge variant="secondary" className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                  Active
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-slate-400">
                              ≈ {getCurrencySymbol(selectedCurrency)}
                              {convertedBalance.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4,
                              })}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-bold text-white">
                                {balance.toLocaleString(undefined, {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              <Button
                                size="sm"
                                variant={hasBalance ? "default" : "ghost"}
                                className={`h-6 w-6 p-0 ${
                                  hasBalance
                                    ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30"
                                    : "text-slate-500 hover:text-slate-400"
                                }`}
                                onClick={() => {
                                  if (hasBalance) {
                                    handleSwapClick(coin.baseToken);
                                    setModalOpen(false);
                                  }
                                }}
                                disabled={!hasBalance}
                              >
                                <Repeat className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        )}
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
      </CardContent>
    </Card>
  );
};

export const StablecoinBalanceButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  return (
    <>
      <div className="relative group z-20">
        {/* Gradient Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-blue-500/5 to-purple-500/5 rounded-2xl"></div>
        
        {/* Hover Glow Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/5 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        {/* Main Card */}
        <div className="relative bg-slate-800/40 backdrop-blur-xl rounded-2xl border border-slate-700/40 p-6 hover:bg-slate-800/60 hover:border-slate-600/60 hover:shadow-2xl hover:shadow-emerald-500/5 transition-all duration-300 transform hover:scale-[1.01]">
          
          {/* Header Section */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {/* <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div> */}
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium tracking-wide uppercase">Total Balance</p>
                <h3 className="text-white text-sm font-semibold">Stablecoins Portfolio</h3>
              </div>
            </div>
            <ChainSwitcher />
          </div>

          {/* Balance Display */}
          <div className="text-center mb-6">
            {loading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-400" />
                <div className="space-y-2">
                  <div className="h-10 bg-gradient-to-r from-slate-700/40 to-slate-600/20 rounded-lg w-32 mx-auto animate-pulse"></div>
                  <div className="h-3 bg-slate-700/20 rounded w-16 mx-auto animate-pulse"></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-3xl md:text-4xl font-bold text-slate-100 leading-tight">
                  ${totalBalance.toLocaleString('en-US', { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-slate-400 text-xs font-medium tracking-wider uppercase">USD</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 flex-wrap">
            <div className="transform hover:scale-[1.02] transition-transform duration-200">
              <WalletKit buttonName="Wallet" />
            </div>
            <div className="w-px h-8 bg-slate-600/30 hidden sm:block"></div>
            <button
              onClick={() => window.location.href = '/ramps'}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500/20 to-yellow-500/20 hover:from-orange-500/30 hover:to-yellow-500/30 border border-orange-500/30 hover:border-orange-400/50 rounded-lg text-orange-300 hover:text-orange-200 text-sm font-medium transition-all duration-200 flex items-center gap-1 sm:gap-2"
            >
              <DollarSign className="w-4 h-4" />
              <span className="hidden xs:inline">Withdraw</span>
              <span className="xs:hidden">Withdraw</span>
            </button>
          </div>

          {/* Status Indicator */}
          {/* <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-emerald-400 font-medium">Live Balance</span>
            </div>
          </div> */}
          
          {/* Decorative Elements */}
          <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-bl from-emerald-500/5 to-transparent rounded-full"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full"></div>
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