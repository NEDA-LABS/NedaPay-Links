import React, { useState, useEffect, useCallback } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "../data/stablecoins";
import { SUPPORTED_CHAINS } from "@/offramp/offrampHooks/constants";
import { X, AlertCircle, Wallet, Loader2, ChevronRight } from "lucide-react";
import SwapModal from "./SwapModal";
import { Button } from "@/components/Button";
import { Repeat, RefreshCw } from "lucide-react";

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
  const [selectedToken, setSelectedToken] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [provider, setProvider] = useState<ethers.providers.Provider | null>(
    null
  );

  // Get wallet address - prioritize embedded wallet, fallback to connected wallet
  const getWalletAddress = useCallback(() => {
    if (user?.wallet?.address) {
      return user.wallet.address;
    }

    // Fallback to any connected wallet
    const connectedWallet = wallets?.find((w) => w.address);
    return connectedWallet?.address || null;
  }, [user, wallets]);

  const address = getWalletAddress();

  // Available currencies for conversion
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

  // Initialize provider for current chain
  const initializeProvider = useCallback(async () => {
    if (!authenticated || !address || wallets.length === 0) {
      setCurrentChain(null);
      setErrors(["Authentication or wallet not available"]);
      return;
    }

    const errorList: string[] = [];
    let newProvider: ethers.providers.Provider | null = null;
    const wallet = wallets[0];

    try {
      // Extract chain ID from wallet (format: "eip155:42161")
      const chainIdHex = wallet.chainId.split(":")[1];
      const chainId = parseInt(chainIdHex, 10);

      // Find matching chain from supported chains
      const matchedChain =
        SUPPORTED_CHAINS.find((c) => c.id === chainId) || null;
      setCurrentChain(matchedChain);

      if (!matchedChain) {
        setErrors([`Chain ID ${chainId} not supported`]);
        return;
      }

      const embeddedWallet = wallets.find(
        (wallet) =>
          wallet.walletClientType === "privy" && wallet.address === address
      );

      if (embeddedWallet) {
        try {
          const privyEthereumProvider =
            await embeddedWallet.getEthereumProvider();
          if (privyEthereumProvider) {
            newProvider = new ethers.providers.Web3Provider(
              privyEthereumProvider
            );
            await newProvider.getBlockNumber();
          }
        } catch (error) {
          console.log("Failed to get Privy provider:", error);
          errorList.push("Failed to initialize Privy provider");
        }
      }

      // Fallback to external wallet
      if (!newProvider && typeof window !== "undefined" && window.ethereum) {
        try {
          newProvider = new ethers.providers.Web3Provider(window.ethereum);
          const accounts = await (
            newProvider as ethers.providers.Web3Provider
          ).listAccounts();
          if (accounts.length === 0) {
            await (window.ethereum as any).request({
              method: "eth_requestAccounts",
            });
          }
          await newProvider.getBlockNumber();
        } catch (error) {
          console.error("Failed to initialize external provider:", error);
          errorList.push("Failed to connect to external wallet");
        }
      }

      if (!newProvider && matchedChain.rpcUrl) {
        try {
          newProvider = new ethers.providers.JsonRpcProvider(
            matchedChain.rpcUrl
          );
          await newProvider.getBlockNumber();
        } catch (error) {
          console.error("Failed to initialize RPC provider:", error);
          errorList.push(
            `Failed to connect to chain ${matchedChain.id} via RPC`
          );
        }
      }

      setProvider(newProvider);
      setErrors(errorList);
    } catch (error) {
      console.error("Error initializing provider:", error);
      setErrors(["Failed to initialize blockchain connection"]);
    }
  }, [authenticated, address, wallets]);

  // Fetch exchange rates from a free API
  const fetchExchangeRates = async () => {
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
            "function decimals() view returns (uint8)",
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
      return "0";
    }
  };

  // Fetch all stablecoin balances for current chain
  const fetchAllBalances = useCallback(async () => {
    if (!address || !authenticated || !provider || !currentChain) {
      console.log("No address, not authenticated, or no provider/chain");
      return;
    }

    setLoading(true);
    setErrors([]);

    const newBalances: StablecoinBalances = {};
    const errorList: string[] = [];

    const balancePromises: Promise<{ token: string; balance: number }>[] = [];

    stablecoins.forEach((coin) => {
      if (!coin.chainIds.includes(currentChain.id)) return;

      const tokenAddress = (
        coin.addresses as Record<string, string | undefined>
      )[currentChain.id.toString()];
      if (!tokenAddress) return;

      const promise = (async () => {
        try {
          let decimals = 18;
          if (typeof coin.decimals === "number") {
            decimals = coin.decimals;
          } else if (
            typeof coin.decimals === "object" &&
            (currentChain.id as ChainId) in coin.decimals
          ) {
            decimals =
              coin.decimals[currentChain.id as keyof typeof coin.decimals];
          }

          const balance = await fetchTokenBalance(
            tokenAddress,
            decimals,
            provider,
            address
          );

          return { token: coin.baseToken, balance: parseFloat(balance) };
        } catch (error) {
          console.error(
            `Failed to fetch ${coin.baseToken} balance on chain ${currentChain.id}:`,
            error
          );
          errorList.push(`Failed to fetch ${coin.baseToken} balance`);
          return { token: coin.baseToken, balance: 0 };
        }
      })();

      balancePromises.push(promise);
    });

    try {
      const results = await Promise.allSettled(balancePromises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          const { token, balance } = result.value;
          newBalances[token] = balance;
        }
      });

      setBalances(newBalances);
      setErrors(errorList);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setErrors(["Failed to fetch token balances"]);
    } finally {
      setLoading(false);
    }
  }, [address, authenticated, provider, currentChain]);

  // Calculate total balance in selected currency
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

  // Convert amount from one currency to another
  const convertCurrency = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      if (!exchangeRates[fromCurrency] || !exchangeRates[toCurrency])
        return amount;

      const usdAmount = amount / exchangeRates[fromCurrency];
      return usdAmount * exchangeRates[toCurrency];
    },
    [exchangeRates]
  );

  // Get currency symbol
  const getCurrencySymbol = (currencyCode: string) => {
    const currency = currencies.find((c) => c.code === currencyCode);
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
      const chainIdHex = wallets[0].chainId.split(":")[1];
      const chainId = parseInt(chainIdHex, 10);
      const matchedChain =
        SUPPORTED_CHAINS.find((c) => c.id === chainId) || null;
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

  // Handle swap click
  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <div className="z-50 flex items-center justify-center md:p-4 overflow-auto rounded-2xl">
      <div className="w-full max-w-6xl bg-gray-800 rounded-2xl shadow-xl">
        <div className="h-full overflow-auto"> 
          <div className="p-6 sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="mt-4 md:mt-0 flex space-x-2">
                {/* <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 text-sm"
                >
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name}
                    </option>
                  ))}
                </select> */}
                {/* <button
                  onClick={() => {
                    fetchAllBalances();
                    fetchExchangeRates();
                  }}
                  disabled={loading}
                  className="px-4 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <RefreshCw className="text-blue-500 hover:text-blue-200" />
                  
                </button> */}
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Stablecoins</h3>
          {/* Stablecoin Cards Grid */}
          <div className="grid grid-cols-2  lg:grid-cols-4 gap-1 md:gap-3 p-4">
          
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
                  {/* Left: Flag & Token */}
                  <div className="flex items-center gap-3"> 
                    <span className="text-2xl">{coin.flag}</span>
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

                  {/* Right: Balance & Action */}
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

          {/* Footer Stats */}
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

          {/* Swap Modal */}
          {swapModalOpen && (
            <SwapModal
              open={swapModalOpen}
              fromSymbol={swapFromSymbol}
              onClose={() => setSwapModalOpen(false)}
              onSwap={handleSwap}
              maxAmount={balances[swapFromSymbol].toLocaleString(undefined, {
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
  const { wallets } = useWallets();

  const chainMap: Record<string, string> = {
    "eip155:1": "Ethereum",
    "eip155:56": "BNB Smart Chain",
    "eip155:137": "Polygon",
    "eip155:42161": "Arbitrum One",
    "eip155:10": "OP Mainnet",
    "eip155:8453": "Base",
    "eip155:534352": "Scroll",
  };

  function getChainName(chainId: string): string {
    return chainMap[chainId] || "Unknown Chain";
  }

  return (
    <>
      {/* Floating Button */}
      <button className="z-40 bg-white/5 rounded-xl border border-white/20 text-center text-sm text-white font-medium p-2 hover:bg-white/10 flex items-center space-x-2 transition-all">
        {loading ? (
          <Loader2 className="animate-spin h-5 w-5" />
        ) : (
          <span>${totalBalance.toFixed(2)}</span>
        )}
        {/* <span>Stablecoins Portfolio ({getChainName(wallets?.[0]?.chainId)})</span> */}
        {/* <ChevronRight className="h-4 w-4" /> */}
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
