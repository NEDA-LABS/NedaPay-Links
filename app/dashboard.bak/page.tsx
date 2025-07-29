"use client";

import { useState, useEffect, useMemo } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import { Toaster, toast } from "react-hot-toast";
import { stablecoins } from "../data/stablecoins";
import { ethers } from "ethers";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { getBasename } from "../utils/getBaseName";
import { Name } from "@coinbase/onchainkit/identity";
import { base } from "wagmi/chains";
import ChartComponent from "./ChartComponet"; // Corrected typo
import PieComponent from "./PieComponent";
import SwapModal from "../components/SwapModal";
import Footer from "../components/Footer";
import { BasenameDisplay } from "../components/WalletSelector";
import {
  DollarSign,
  BarChart2,
  TrendingUp,
  CreditCard,
  Repeat,
  FileText,
  Activity,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Link,
  Loader2,
} from "lucide-react";
import { FaArrowRight, FaMoneyBill } from "react-icons/fa6";
import { FaCoins } from "react-icons/fa";
import WalletStatusSection from "../components/WalletStatusSection";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Multicall3 contract ABI (minimal)
const MULTICALL3_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)",
];

// Multicall3 contract address on Base Mainnet
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// Function to process balances data
const processBalances = (
  balanceData: Record<string, string>,
  networkChainId?: number
) => {
  const processed = stablecoins.map((coin) => {
    let balance = "0";
    if (!networkChainId || coin.chainId === networkChainId) {
      balance = balanceData[coin.baseToken] || "0";
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance,
      flag: coin.flag || "🌐",
      region: coin.region || "Unknown",
    };
  });

  const total = processed.reduce((sum, coin) => {
    const balanceNum = parseFloat(coin.balance.replace(/,/g, "")) || 0;
    return sum + balanceNum;
  }, 0);

  const processedCoins = processed.map((coin) => {
    const balanceNum = parseFloat(coin.balance.replace(/,/g, "")) || 0;
    return {
      ...coin,
      percentage: total > 0 ? Math.round((balanceNum / total) * 100) : 0,
    };
  });

  const allStablecoins = stablecoins.map((coin) => {
    const existingCoin = processed.find((p) => p.symbol === coin.baseToken);
    if (existingCoin) {
      return existingCoin;
    }
    return {
      symbol: coin.baseToken,
      name: coin.name,
      balance: "0",
      flag: coin.flag || "🌐",
      region: coin.region || "Unknown",
    };
  });

  return {
    processedBalances: allStablecoins,
    totalReceived: total.toLocaleString(),
    processedStablecoins: processedCoins,
  };
};

// Function to fetch transactions from the database
const fetchTransactionsFromDB = async (
  selectedWalletAddress: string | undefined,
  setTransactions: (txs: any[]) => void,
  setIsTransactionLoading: (loading: boolean) => void
) => {
  if (!selectedWalletAddress) return;
  setIsTransactionLoading(true);
  try {
    const response = await fetch(
      `/api/transactions?merchantId=${selectedWalletAddress}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch transactions");
    }
    const transactions = await response.json();
    const formattedTransactions = transactions.map((tx: any) => ({
      id: tx.txHash,
      shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
      date: new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16),
      amount: tx.amount.toString(),
      currency: tx.currency,
      status: tx.status,
      sender: tx.wallet,
      senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
      blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
    }));
    setTransactions(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions from DB:", error);
    setTransactions([]);
  } finally {
    setIsTransactionLoading(false);
  }
};

export default function MerchantDashboard() {
  const [selectedWalletType, setSelectedWalletType] = useState<"eoa" | "smart">(
    "eoa"
  );
  const [smartWalletAddress, setSmartWalletAddress] = useState<string | null>(
    null
  );
  const [smartWalletLoading, setSmartWalletLoading] = useState(false);

  // Replace wagmi hooks with Privy hooks
  const { authenticated, user, connectWallet, logout, ready, login } =
    usePrivy();

  // Get the address from user object
  const address = user?.wallet?.address;
  const isConnected = authenticated && !!address;

  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");

  const selectedWalletAddress =
    selectedWalletType === "eoa"
      ? address
      : smartWalletAddress && smartWalletAddress !== address
        ? smartWalletAddress
        : undefined;
  const [copied, setCopied] = useState(false);
  const [networkWarning, setNetworkWarning] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [errorTokens, setErrorTokens] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [isLoadingPaymentLink, setIsLoadingPaymentLink] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [isBalanceLoading, setIsBalanceLoading] = useState<boolean>(false);
  const [baseName, setBaseName] = useState<string | null>(null);

  // State for the provider - simplified to use RPC provider
  const provider = useMemo(() => {
    return new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
  }, []);

  // isDarkMode state for dynamic theme detection
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    typeof window !== "undefined" &&
      (document.body.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches)
  );

  // Updates theme when it changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newDarkMode = document.body.classList.contains("dark");
      setIsDarkMode(newDarkMode);
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Formats address to normal string
  function toHexAddress(address: string | undefined): `0x${string}` {
    if (!address || typeof address !== "string") {
      throw new Error("Invalid address provided");
    }
    return (
      address.startsWith("0x") ? address : `0x${address}`
    ) as `0x${string}`;
  }

  // Use with selectedWalletAddress
  useEffect(() => {
    if (!selectedWalletAddress) {
      setBaseName(null);
      return;
    }

    const address = toHexAddress(selectedWalletAddress);
    if (!address) {
      console.error("Invalid address format");
      setBaseName(null);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        const basename = await getBasename(address);
        if (basename === undefined) {
          throw new Error("Failed to resolve address to name");
        }
        if (isMounted) {
          setBaseName(basename);
        }
      } catch (error) {
        console.error("Error fetching base name:", error);
        if (isMounted) {
          setBaseName(null);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedWalletAddress]);

  const { processedBalances } = processBalances(balances);

  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  const handleSwap = (from: string, to: string, amount: string) => {
    setSwapModalOpen(false);
    toast.success(`Swap successful! ${amount} ${from} swapped to ${to}.`);
  };

  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function updateSmartWalletAddress() {
      if (selectedWalletType !== "smart" || !address) {
        setSmartWalletAddress(null);
        return;
      }
      setSmartWalletLoading(true);
      const cacheKey = `smartWallet_${address}`;
      let smartAddr: string | null = null;
      if (typeof window !== "undefined") {
        const storedWallet = localStorage.getItem(cacheKey);
        if (storedWallet) {
          try {
            const wallet = JSON.parse(storedWallet);
            if (wallet && wallet.address) {
              smartAddr = wallet.address;
              setSmartWalletAddress(wallet.address);
              setSmartWalletLoading(false);
              return;
            }
          } catch {}
        }
      }
      try {
        const { getSmartWalletAddress } = await import("../utils/smartWallet");
        const realSmartWallet = await getSmartWalletAddress(
          address,
          0,
          provider
        );
        setSmartWalletAddress(realSmartWallet);
        if (typeof window !== "undefined") {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ address: realSmartWallet })
          );
        }
      } catch (err) {
        setSmartWalletAddress(null);
        console.error("Failed to fetch smart wallet address", err);
      }
      setSmartWalletLoading(false);
    }
    updateSmartWalletAddress();
  }, [address, selectedWalletType, provider]);

  useEffect(() => {
    if (
      isConnected &&
      ((selectedWalletType === "eoa" && address) ||
        (selectedWalletType === "smart" &&
          smartWalletAddress &&
          smartWalletAddress !== address))
    ) {
      fetchRealBalances(selectedWalletAddress!);
    }
  }, [
    isConnected,
    selectedWalletAddress,
    selectedWalletType,
    smartWalletAddress,
    address,
  ]);

  // Fetch transactions from the database
  useEffect(() => {
    if (isConnected && selectedWalletAddress) {
      fetchTransactionsFromDB(
        selectedWalletAddress,
        setTransactions,
        setIsTransactionLoading
      );
    }
  }, [isConnected, selectedWalletAddress]);

  // Live event listener for real-time transaction updates
  useEffect(() => {
    if (!isConnected || !selectedWalletAddress) return;

    let intervalId: NodeJS.Timeout;
    let knownTxHashes = new Set<string>();
    let isInitialLoad = true; // Flag to skip initial notification

    const fetchAndNotifyNewTransactions = async () => {
      try {
        const response = await fetch(
          `/api/transactions?merchantId=${selectedWalletAddress}`
        );
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const transactions = await response.json();
        const currentTxHashes: Set<string> = new Set(
          transactions.map((tx: any) => tx.txHash)
        );

        // On initial load, set baseline without notifying
        if (isInitialLoad) {
          knownTxHashes = new Set(currentTxHashes); // Populate with all existing hashes
          isInitialLoad = false; // Disable initial load flag after first run
          return; // Exit without notification
        }

        // Check for new transactions only after initial load
        const newTxHashes = new Set(
          [...currentTxHashes].filter((hash) => !knownTxHashes.has(hash))
        );
        if (newTxHashes.size > 0) {
          // Find the newest transaction (assuming createdAt is available and sorted descending)
          const newTransactions = transactions
            .filter((tx: any) => newTxHashes.has(tx.txHash))
            .sort(
              (a: any, b: any) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            );
          const lastTransaction = newTransactions[0];

          if (lastTransaction) {
            const shortSender =
              lastTransaction.wallet.slice(0, 6) +
              "..." +
              lastTransaction.wallet.slice(-4);
            const message = `Payment received: ${parseFloat(lastTransaction.amount)} ${lastTransaction.currency} from ${shortSender}`;
            toast.success(message, { duration: 6000 });
            window.dispatchEvent(
              new CustomEvent("neda-notification", {
                detail: { message },
              })
            );
            knownTxHashes.add(lastTransaction.txHash); // Update with new hash
          }
        }
      } catch (error) {
        console.error("Error checking for new transactions:", error);
      }
    };

    // Initial fetch to set baseline
    fetchAndNotifyNewTransactions();

    // Start polling after initial load
    intervalId = setInterval(fetchAndNotifyNewTransactions, 10000); // Poll every 10 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, selectedWalletAddress]);

  // Wallet connection check and redirection
  useEffect(() => {
    if (!mounted || !ready) return;

    // For Privy, check if user is authenticated
    if (!authenticated) {
      router.push("/?walletRequired=true");
    }
  }, [mounted, authenticated, ready, router]);

  // Periodic balance refresh with debounce
  useEffect(() => {
    if (!isConnected || !selectedWalletAddress) return;

    let isFetching = false;
    const refreshInterval = setInterval(async () => {
      if (isFetching) return; // Skip if already fetching
      isFetching = true;
      try {
        await fetchRealBalances(selectedWalletAddress);
      } finally {
        isFetching = false;
      }
    }, 5000); // Refresh every 5 seconds

    return () => {
      clearInterval(refreshInterval);
    };
  }, [isConnected, selectedWalletAddress]);

  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  const BASE_MAINNET_CHAIN_ID = 8453;

  const fetchRealBalances = async (walletAddress: string) => {
    try {
      setIsBalanceLoading(true);
      const network = await provider.getNetwork();
      if (network.chainId !== BASE_MAINNET_CHAIN_ID) {
        setNetworkWarning(true);
        setBalances({});
        return;
      }
      setNetworkWarning(false);

      const filteredCoins = stablecoins.filter(
        (coin) =>
          coin.chainId === BASE_MAINNET_CHAIN_ID &&
          coin.address &&
          /^0x[a-fA-F0-9]{40}$/.test(coin.address)
      );

      if (!filteredCoins.length) {
        setBalances({});
        return;
      }

      // Prepare Multicall3 calls
      const calls = filteredCoins.flatMap((coin) => [
        {
          target: coin.address,
          allowFailure: true,
          callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
            "balanceOf",
            [walletAddress]
          ),
        },
        {
          target: coin.address,
          allowFailure: true,
          callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
            "decimals",
            []
          ),
        },
      ]);

      const multicallContract = new ethers.Contract(
        MULTICALL3_ADDRESS,
        MULTICALL3_ABI,
        provider
      );

      const results = await multicallContract.aggregate3(calls);
      const realBalances: Record<string, string> = {};
      const tokenErrors: Record<string, string> = {};

      filteredCoins.forEach((coin, index) => {
        const balanceResult = results[index * 2];
        const decimalsResult = results[index * 2 + 1];

        if (!balanceResult.success || !decimalsResult.success) {
          tokenErrors[coin.baseToken] = `Failed to fetch ${
            !balanceResult.success ? "balance" : "decimals"
          }`;
          return;
        }

        try {
          const balance = ethers.utils.defaultAbiCoder.decode(
            ["uint256"],
            balanceResult.returnData
          )[0];
          const decimals = ethers.utils.defaultAbiCoder.decode(
            ["uint8"],
            decimalsResult.returnData
          )[0];
          const formatted = ethers.utils.formatUnits(balance, decimals);
          realBalances[coin.baseToken] = parseFloat(formatted).toLocaleString();
        } catch (err: any) {
          tokenErrors[coin.baseToken] = err.message || "Error decoding data";
        }
      });

      setBalanceError(Object.keys(tokenErrors).length > 0);
      setErrorTokens(tokenErrors);
      setBalances(realBalances);
    } catch (error) {
      console.error("Error fetching balances:", error);
      setBalanceError(true);
      setBalances({});
    } finally {
      setIsBalanceLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <>
      <Toaster position="top-right" />
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white">
        <Header />
        {networkWarning && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative m-4">
            <strong className="font-bold">Network Error:</strong>
            <span className="block sm:inline">
              {" "}
              Please switch your wallet to <b>Base Mainnet</b> (chainId 8453) to
              view your balances.
            </span>
          </div>
        )}
        <div className="flex-grow">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
              <div className="flex flex-col md:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative p-2">
                  <div className="absolute -top-2 -left-2 w-16 h-16 bg-blue-300/10 rounded-full blur-xl"></div>
                  <div>
                    <h1 className="text-2xl sm:text-2xl lg:text-4xl font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-blue-600">
                      Your Dashboard
                    </h1>
                    <p className="text-sm sm:text-base text-slate-700 mt-1">
                      Seamlessly manage stablecoin payments and monitor your
                      business performance
                    </p>
                  </div>
                </div>
                {isTransactionLoading && (
                  <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-xs sm:text-sm text-blue-600">
                      Loading data...
                    </span>
                  </div>
                )}
              </div>
              <div className="py-4 flex flex-col md:!flex-row items-stretch gap-2">
                <div className=" p-6 flex-1 bg-gradient-to-br from-blue-600/90 to-indigo-600/90 rounded-xl shadow-lg hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden backdrop-blur-md">
                  {/* Background Accents */}
                  <div className="absolute inset-0 bg-white/5 backdrop-blur-xl"></div>
                  <div className="absolute -top-6 -left-6 w-32 h-32 bg-blue-800/20 rounded-full blur-2xl animate-pulse-slow"></div>
                  <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-800/20 rounded-full blur-2xl animate-pulse-slow"></div>
                  <div>
                    <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6 lg:gap-8">
                      <div className="flex-1">
                        <h2 className="text-xl lg:text-2xl font-semibold text-white mb-3 flex items-center gap-3">
                          Welcome Back
                          {selectedWalletAddress && (
                            <span className="inline-flex items-center px-3 py-1 bg-white/15 rounded-lg text-sm font-medium text-white/95 backdrop-blur-sm border border-white/10">
                              <BasenameDisplay
                                address={selectedWalletAddress}
                                basenameClassName="text-sm font-semibold text-white/95"
                                isMobile={false}
                              />
                            </span>
                          )}
                        </h2>

                        <p className="text-white/80 mb-6 max-w-lg leading-relaxed">
                          {(() => {
                            const messages = [
                              "Unleash your business potential with NEDA Pay's seamless crypto payments.",
                              "Your dashboard is live—ready to scale your transactions?",
                              "Empower your growth with NEDA Pay's cutting-edge tools.",
                              "Support at your fingertips—let's elevate your business today.",
                              "Transform payments into opportunities with NEDA Pay.",
                            ];
                            return messages[
                              Math.floor(Math.random() * messages.length)
                            ];
                          })()}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <button
                            onClick={() => {
                              setIsLoadingPaymentLink(true);
                              router.push("/payment-link");
                            }}
                            className="!bg-white !text-blue-600 hover:!bg-blue-50 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoadingPaymentLink}
                          >
                            {isLoadingPaymentLink ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                Payment Link
                                <FaArrowRight className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => {
                              router.push("#swap");
                            }}
                            className="!bg-white/90 !text-blue-600 hover:!bg-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md hidden lg:!flex"
                          >
                            Swap Coins
                            <Repeat className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              router.push("/offramp");
                            }}
                            className="!bg-white/90 !text-blue-600 hover:!bg-white px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                          >
                            Transfer to Fiat
                            <FaMoneyBill className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => {
                              setIsLoadingSettings(true);
                              router.push("/settings");
                            }}
                            className="!bg-white/80 !text-blue-600 hover:!bg-white/90 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 items-center justify-center gap-2 border border-white/20 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed hidden lg:!flex"
                            disabled={isLoadingSettings}
                          >
                            {isLoadingSettings ? (
                              "Loading..."
                            ) : (
                              <>
                                Customize Dashboard
                                <FaArrowRight className="h-3.5 w-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="hidden lg:block">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                          <DollarSign
                            className="w-8 h-8 text-white"
                            strokeWidth={2.5}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <WalletStatusSection
                  selectedWalletAddress={selectedWalletAddress}
                  selectedWalletType={selectedWalletType}
                />
              </div>
            </div>

            <h2 className="text-2xl font-semibold mb-4">
              Summary of Transactions
            </h2>
            {/* Simple Analytics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Received */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in border border-2 !border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="relative flex items-center gap-2 mb-2">
                  <FaCoins
                    className="w-5 h-5 text-blue-600"
                    strokeWidth={2.5}
                  />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Total Received
                  </h3>
                </div>
                <div className="flex flex-col gap-1 text-xl sm:text-2xl font-semibold text-slate-800">
                  {isBalanceLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-xs sm:text-sm text-blue-600">
                        Refreshing balances...
                      </span>
                    </div>
                  ) : balanceError ? (
                    <span className="text-red-600">N/A</span>
                  ) : (
                    (() => {
                      const processed =
                        processBalances(balances).processedBalances;
                      const nonZero = processed.filter(
                        (c) => parseFloat(c.balance.replace(/,/g, "")) > 0
                      );
                      if (!nonZero.length) return "0";
                      return nonZero.map((c) => (
                        <div
                          key={c.symbol}
                          className="flex items-center gap-2 text-sm sm:text-base"
                        >
                          <span>{c.flag}</span>
                          <span className="font-semibold">{c.balance}</span>
                          <span className="ml-1">{c.symbol}</span>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>

              {/* Total Transactions */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in animation-delay-100 border border-2 !border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="relative flex items-center gap-2 mb-2">
                  <BarChart2
                    className="w-5 h-5 text-indigo-600"
                    strokeWidth={2.5}
                  />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Total Transactions
                  </h3>
                </div>
                <div className="flex flex-col gap-1 text-xl sm:text-2xl font-semibold text-slate-800">
                  {(() => {
                    const grouped: Record<
                      string,
                      { count: number; flag: string }
                    > = {};
                    transactions.forEach((tx) => {
                      const symbol = tx.currency;
                      if (!grouped[symbol]) {
                        const coin = stablecoins.find(
                          (c) => c.baseToken === symbol
                        );
                        grouped[symbol] = {
                          count: 0,
                          flag: coin?.flag || "🏳️",
                        };
                      }
                      grouped[symbol].count++;
                    });
                    const entries = Object.entries(grouped).filter(
                      ([sym, data]) => data.count > 0
                    );
                    if (!entries.length) return "0";
                    return entries.map(([symbol, data]) => (
                      <div
                        key={symbol}
                        className="flex items-center gap-2 text-sm sm:text-base"
                      >
                        <span>{data.flag}</span>
                        <span className="font-semibold">
                          {data.count.toLocaleString()}
                        </span>
                        <span className="ml-1">{symbol}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Average Transaction */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in animation-delay-200 border border-2 !border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="relative flex items-center gap-2 mb-2">
                  <TrendingUp
                    className="w-5 h-5 text-purple-600"
                    strokeWidth={2.5}
                  />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Average Transaction
                  </h3>
                </div>
                <div className="flex flex-col gap-1 text-xl sm:text-2xl font-semibold text-slate-800">
                  {(() => {
                    const grouped: Record<
                      string,
                      { sum: number; count: number; flag: string }
                    > = {};
                    transactions.forEach((tx) => {
                      const symbol = tx.currency;
                      if (!grouped[symbol]) {
                        const coin = stablecoins.find(
                          (c) => c.baseToken === symbol
                        );
                        grouped[symbol] = {
                          sum: 0,
                          count: 0,
                          flag: coin?.flag || "🏳️",
                        };
                      }
                      grouped[symbol].sum +=
                        parseFloat((tx.amount || "0").replace(/,/g, "")) || 0;
                      grouped[symbol].count++;
                    });
                    const entries = Object.entries(grouped).filter(
                      ([sym, data]) => data.count > 0
                    );
                    if (!entries.length) return "0";
                    return entries.map(([symbol, data]) => (
                      <div
                        key={symbol}
                        className="flex items-center gap-2 text-sm sm:text-base"
                      >
                        <span>{data.flag}</span>
                        <span className="font-semibold">
                          {Math.round(data.sum / data.count).toLocaleString()}
                        </span>
                        <span className="ml-1">{symbol}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Monthly Growth */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in animation-delay-300 border border-2 !border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="relative flex items-center gap-2 mb-2">
                  <Repeat className="w-5 h-5 text-cyan-600" strokeWidth={2.5} />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Monthly Growth
                  </h3>
                </div>
                <div className="text-xl sm:text-2xl font-semibold text-slate-800">
                  {(() => {
                    const now = new Date();
                    const thisMonth = now.getMonth();
                    const thisYear = now.getFullYear();
                    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
                    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;
                    let thisMonthSum = 0;
                    let prevMonthSum = 0;
                    transactions.forEach((tx) => {
                      const txDate = new Date(tx.date);
                      const amt =
                        parseFloat((tx.amount || "0").replace(/,/g, "")) || 0;
                      if (
                        txDate.getFullYear() === thisYear &&
                        txDate.getMonth() === thisMonth
                      ) {
                        thisMonthSum += amt;
                      } else if (
                        txDate.getFullYear() === prevYear &&
                        txDate.getMonth() === prevMonth
                      ) {
                        prevMonthSum += amt;
                      }
                    });
                    if (prevMonthSum === 0 && thisMonthSum === 0) return "N/A";
                    if (prevMonthSum === 0) return "+100%";
                    const growth =
                      ((thisMonthSum - prevMonthSum) / prevMonthSum) * 100;
                    const sign = growth >= 0 ? "+" : "";
                    return (
                      <span
                        className={
                          growth >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {`${sign}${growth.toFixed(1)}%`}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in animation-delay-400 border border-2 !border-blue-500">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="relative flex items-center gap-2 mb-2">
                  <CreditCard
                    className="w-5 h-5 text-blue-600"
                    strokeWidth={2.5}
                  />
                  <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                    Payment Methods
                  </h3>
                </div>
                <div className="flex flex-col gap-1 text-xl sm:text-2xl font-semibold text-slate-800">
                  {(() => {
                    const usedSymbols = Array.from(
                      new Set(transactions.map((tx) => tx.currency))
                    );
                    if (!usedSymbols.length) return "None";
                    return usedSymbols.map((symbol) => {
                      const coin = stablecoins.find(
                        (c) => c.baseToken === symbol
                      );
                      return (
                        <div
                          key={symbol}
                          className="flex items-center gap-2 text-sm sm:text-base"
                        >
                          <span>{coin?.flag || "🏳️"}</span>
                          <span className="font-semibold">{symbol}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <style jsx global>{`
                /* Slide-in animation */
                .animate-slide-in {
                  opacity: 0;
                  transform: translateY(15px);
                  animation: slideIn 0.6s ease-out forwards;
                }

                .animation-delay-100 {
                  animation-delay: 0.1s;
                }

                .animation-delay-200 {
                  animation-delay: 0.2s;
                }

                .animation-delay-300 {
                  animation-delay: 0.3s;
                }

                .animation-delay-400 {
                  animation-delay: 0.4s;
                }

                @keyframes slideIn {
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                /* Shimmer effect */
                .animate-shimmer {
                  transform: translateX(-100%);
                  animation: shimmer 3s infinite linear;
                }

                @keyframes shimmer {
                  100% {
                    transform: translateX(100%);
                  }
                }
              `}</style>
            </div>
            {/* charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Daily Revenue
                  </h2>
                  <select
                    className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-white !text-slate-800 w-auto"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="all" className="text-slate-800">
                      All Currencies
                    </option>
                    {stablecoins.map((coin: any) => (
                      <option
                        key={coin.baseToken}
                        value={coin.baseToken}
                        className="text-slate-800"
                      >
                        {coin.flag} {coin.baseToken}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative h-48 sm:h-64 max-w-full overflow-x-auto scroll-smooth">
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
                  <div className="w-full min-w-[300px]">
                    <ChartComponent
                      transactions={
                        selectedCurrency === "all"
                          ? transactions
                          : transactions.filter(
                              (tx: any) => tx.currency === selectedCurrency
                            )
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-base sm:text-lg font-bold text-slate-800">
                    Payment Methods
                  </h2>
                  <select
                    className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-white !text-slate-800 w-auto"
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                  >
                    <option value="all" className="text-slate-800">
                      All Currencies
                    </option>
                    {stablecoins.map((coin: any) => (
                      <option
                        key={coin.baseToken}
                        value={coin.baseToken}
                        className="text-slate-800"
                      >
                        {coin.flag} {coin.baseToken}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative h-48 sm:h-64 max-w-full overflow-x-auto scroll-smooth">
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
                  <div className="w-full min-w-[300px]">
                    <PieComponent
                      transactions={
                        selectedCurrency === "all"
                          ? transactions
                          : transactions.filter(
                              (tx: any) => tx.currency === selectedCurrency
                            )
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 sm:gap-6 mb-8">
              <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1 relative overflow-hidden animate-slide-in">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse-slow"></div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse-slow"></div>
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                      <Activity
                        className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-600"
                        strokeWidth={2.5}
                      />
                      Recent Transactions
                    </h3>
                    <div className="relative">
                      <select
                        className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-white !text-slate-800 w-auto"
                        value={selectedCurrency}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                      >
                        <option value="all" className="text-slate-800">
                          All Currencies
                        </option>
                        {stablecoins.map((coin: any) => (
                          <option
                            key={coin.baseToken}
                            value={coin.baseToken}
                            className="text-slate-800"
                          >
                            {coin.flag} {coin.baseToken}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-x-auto overflow-y-hidden scroll-smooth">
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-slate-100 to-transparent pointer-events-none z-10"></div>
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-slate-100 to-transparent pointer-events-none z-10"></div>
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[100px]">
                          Tx Hash
                        </th>
                        <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[100px]">
                          Sender
                        </th>
                        <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[120px]">
                          Date
                        </th>
                        <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[80px]">
                          Amount
                        </th>
                        <th className="px-3 sm:px-5 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider min-w-[80px]">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {isTransactionLoading ? (
                        Array(5)
                          .fill(0)
                          .map((_, index) => (
                            <tr
                              key={`loading-${index}`}
                              className="animate-pulse"
                            >
                              <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-nowrap">
                                <div className="h-4 w-20 bg-slate-200 rounded"></div>
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-nowrap">
                                <div className="h-4 w-16 bg-slate-200 rounded"></div>
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-nowrap">
                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-nowrap">
                                <div className="h-4 w-16 bg-slate-200 rounded"></div>
                              </td>
                              <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-nowrap">
                                <div className="h-4 w-14 bg-slate-200 rounded"></div>
                              </td>
                            </tr>
                          ))
                      ) : (selectedCurrency === "all"
                          ? transactions
                          : transactions.filter(
                              (tx) => tx.currency === selectedCurrency
                            )
                        ).length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-3 sm:px-5 py-6 sm:py-10 text-center text-xs sm:text-sm text-slate-600"
                          >
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <FileText
                                className="w-8 sm:w-12 h-8 sm:h-12 text-slate-400"
                                strokeWidth={1.5}
                              />
                              <p>No transactions found</p>
                              <button
                                onClick={() => router.push("/payment-link")}
                                className="mt-2 inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                              >
                                Create Payment Link
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (selectedCurrency === "all"
                          ? transactions
                          : transactions.filter(
                              (tx) => tx.currency === selectedCurrency
                            )
                        ).map((tx, index) => (
                          <tr
                            key={tx.id}
                            className={`hover:bg-blue-50 transition-colors duration-150 animate-fade-in ${index % 2 === 0 ? "bg-white" : "bg-slate-50"}`}
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-normal min-w-[100px]">
                              <a
                                href={tx.blockExplorerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-xs sm:text-sm"
                              >
                                <span className="mr-1 text-[10px] sm:text-xs bg-blue-100 text-blue-800 py-0.5 px-1 sm:px-2 rounded-md flex items-center">
                                  <ExternalLink
                                    className="w-2 sm:w-3 h-2 sm:h-3 inline mr-0.5"
                                    strokeWidth={2}
                                  />
                                  Tx
                                </span>
                                <span className="truncate">{tx.shortId}</span>
                              </a>
                            </td>
                            <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-normal min-w-[100px]">
                              <a
                                href={`https://basescan.org/address/${tx.sender}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-xs sm:text-sm"
                              >
                                <span className="inline-block w-4 sm:w-6 h-4 sm:h-6 rounded-full bg-blue-100 text-blue-800 mr-1 sm:mr-2 flex items-center justify-center">
                                  <User
                                    className="w-2 sm:w-3 h-2 sm:h-3"
                                    strokeWidth={2}
                                  />
                                </span>
                                <span className="truncate">
                                  {tx.senderShort}
                                </span>
                              </a>
                            </td>
                            <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-normal min-w-[120px] text-xs sm:text-sm">
                              <div className="flex items-center text-slate-800">
                                <Calendar
                                  className="w-3 sm:w-4 h-3 sm:h-4 text-slate-500 mr-1"
                                  strokeWidth={2}
                                />
                                {tx.date}
                              </div>
                            </td>
                            <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-normal min-w-[80px]">
                              <div className="font-medium text-xs sm:text-sm">
                                <span className="text-green-600 font-bold">
                                  {tx.amount}
                                </span>
                                <span className="ml-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                                  {tx.currency}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 sm:px-5 py-2 sm:py-4 whitespace-normal min-w-[80px]">
                              <span
                                className={`px-2 sm:px-3 py-1 inline-flex items-center text-[10px] sm:text-xs font-medium rounded-full ${
                                  tx.status === "Completed"
                                    ? "bg-green-100 text-green-800 border border-green-200"
                                    : tx.status === "Pending"
                                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                      : "bg-red-100 text-red-800 border border-red-200"
                                }`}
                              >
                                {tx.status === "Completed" ? (
                                  <CheckCircle2
                                    className="w-2 sm:w-3 h-2 sm:h-3 mr-1"
                                    strokeWidth={2}
                                  />
                                ) : tx.status === "Pending" ? (
                                  <Clock
                                    className="w-2 sm:w-3 h-2 sm:h-3 mr-1"
                                    strokeWidth={2}
                                  />
                                ) : (
                                  <XCircle
                                    className="w-2 sm:w-3 h-2 sm:h-3 mr-1"
                                    strokeWidth={2}
                                  />
                                )}
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 sm:p-5 border-t border-slate-200 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 relative">
                  <div className="flex justify-center">
                    <a
                      href="/all-transactions"
                      className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white !bg-blue-500 rounded-md hover:!bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                    >
                      <svg
                        className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      View All Transactions
                    </a>
                  </div>
                </div>
                <style jsx global>{`
                  .animate-slide-in {
                    opacity: 0;
                    transform: translateY(15px);
                    animation: slideIn 0.6s ease-out forwards;
                  }

                  @keyframes slideIn {
                    to {
                      opacity: 1;
                      transform: translateY(0);
                    }
                  }

                  .animate-fade-in {
                    opacity: 0;
                    animation: fadeIn 0.4s ease-out forwards;
                  }

                  @keyframes fadeIn {
                    to {
                      opacity: 1;
                    }
                  }

                  .animate-shimmer {
                    transform: translateX(-100%);
                    animation: shimmer 3s infinite linear;
                  }

                  @keyframes shimmer {
                    100% {
                      transform: translateX(100%);
                    }
                  }

                  .animate-pulse-slow {
                    animation: pulseSlow 6s ease-in-out infinite;
                  }

                  @keyframes pulseSlow {
                    0%,
                    100% {
                      opacity: 0.3;
                    }
                    50% {
                      opacity: 0.6;
                    }
                  }
                `}</style>
              </div>
              <div
                id="swap"
                className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl border-2 !border-blue-500"
              >
                <div className="p-4 sm:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <h2 className="text-base sm:text-xl font-semibold text-gray-900 flex items-center">
                    <svg
                      className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-blue-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Stablecoin Balances
                  </h2>
                </div>
                <div className="relative overflow-x-auto overflow-y-hidden scroll-smooth">
                  <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 to-transparent pointer-events-none"></div>
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 to-transparent pointer-events-none"></div>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="">
                      <tr>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[120px]">
                          Coin
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                          Balance
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider max-w-[80px]">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="global divide-y divide-gray-200">
                      {processedBalances.map((coin: any, index: any) => {
                        const balanceNum = parseFloat(
                          String(coin.balance).replace(/,/g, "")
                        );
                        const hasBalance = balanceNum > 0;

                        return (
                          <tr
                            key={coin.symbol}
                            className={`hover:bg-blue-50 transition-colors duration-150 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[120px]">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-6 sm:h-8 w-6 sm:w-8 flex items-center justify-center rounded-full bg-blue-100 text-base sm:text-lg">
                                  {coin.flag}
                                </div>
                                <div className="ml-2 sm:ml-4">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                    {coin.symbol}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                                    {coin.name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                              <div
                                className={`text-xs sm:text-sm font-semibold truncate ${
                                  hasBalance
                                    ? "text-green-600"
                                    : "text-gray-500"
                                }`}
                              >
                                {coin.balance}
                              </div>
                            </td>
                            <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                              <button
                                className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-[10px] sm:text-xs font-medium rounded-md shadow-sm !bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() =>
                                  hasBalance && handleSwapClick(coin.symbol)
                                }
                                disabled={!hasBalance}
                                title={
                                  hasBalance
                                    ? `Swap ${coin.symbol}`
                                    : `No ${coin.symbol} balance to swap`
                                }
                              >
                                <svg
                                  className="w-3 sm:w-4 h-3 sm:h-4 mr-1"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                                  />
                                </svg>
                                Swap
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {swapModalOpen && (
              <SwapModal
                open={swapModalOpen}
                fromSymbol={swapFromSymbol}
                onClose={() => setSwapModalOpen(false)}
                onSwap={handleSwap}
                maxAmount={
                  processedBalances.find(
                    (b: any) => b.symbol === swapFromSymbol
                  )?.balance || "0"
                }
              />
            )}
          </div>
          {/* Quick Actions */}

          <div className="w-[80%] mx-auto bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-md hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 relative overflow-hidden animate-slide-in border-2 !border-blue-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse-slow"></div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse-slow"></div>
            <h3 className="text-lg sm:text-xl font-bold text-black mb-6 relative">
              Quick Actions
            </h3>
            <div className="space-y-4 flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsLoadingPaymentLink(true);
                  document.cookie =
                    "wallet_connected=true; path=/; max-age=86400";
                  setTimeout(() => {
                    router.push("/payment-link");
                  }, 100);
                }}
                className="p-4 w-full !bg-blue-100 rounded-lg border !border-blue-200 hover:!bg-blue-300 hover:!text-white-slate-50 hover:!shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-start gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingPaymentLink}
                aria-label="Create Payment Link"
                aria-busy={isLoadingPaymentLink}
              >
                {isLoadingPaymentLink ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <p className="font-semibold text-blue-600">Processing...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Link
                        className="w-4 h-4 !text-blue-600"
                        strokeWidth={2.5}
                      />
                      <p className="font-semibold text-slate-800">
                        Create Payment Link
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      Generate a payment link to share with customers
                    </p>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsLoadingInvoice(true);
                  router.push("/invoice");
                }}
                className="p-4 w-full !bg-indigo-100 rounded-lg border !border-indigo-200 hover:!bg-indigo-300 hover:!text-white-slate-50 hover:!shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-start gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingInvoice}
                aria-label="Generate Invoice"
                aria-busy={isLoadingInvoice}
              >
                {isLoadingInvoice ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <p className="font-semibold text-indigo-600">
                      Processing...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <FileText
                        className="w-4 h-4 text-indigo-600"
                        strokeWidth={2.5}
                      />
                      <p className="font-semibold text-slate-800">
                        Generate Invoice
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      Send an invoice to your customer for payment
                    </p>
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setIsLoadingAnalytics(true);
                  router.push("/analytics");
                }}
                className="p-4 w-full !bg-purple-100 rounded-lg border !border-purple-200 hover:!bg-purple-300 hover:!text-white-slate-50 hover:!shadow-blue-500/20 hover:-translate-y-0.5 transition-all duration-200 flex flex-col items-start gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoadingAnalytics}
                aria-label="View Analytics"
                aria-busy={isLoadingAnalytics}
              >
                {isLoadingAnalytics ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <p className="font-semibold text-purple-600">
                      Processing...
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <BarChart2
                        className="w-4 h-4 text-purple-600"
                        strokeWidth={2.5}
                      />
                      <p className="font-semibold text-slate-800">
                        View Detailed Analytics
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                      Detailed reports and business insights
                    </p>
                  </>
                )}
              </button>
            </div>
            <style jsx global>{`
              .animate-slide-in {
                opacity: 0;
                transform: translateY(15px);
                animation: slideIn 0.6s ease-out forwards;
              }

              @keyframes slideIn {
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }

              .animate-fade-in {
                opacity: 0;
                animation: fadeIn 0.4s ease-out forwards;
              }

              @keyframes fadeIn {
                to {
                  opacity: 1;
                }
              }

              .animate-shimmer {
                transform: translateX(-100%);
                animation: shimmer 3s infinite linear;
              }

              @keyframes shimmer {
                100% {
                  transform: translateX(100%);
                }
              }

              .animate-pulse-slow {
                animation: pulseSlow 6s ease-in-out infinite;
              }

              @keyframes pulseSlow {
                0%,
                100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 0.6;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
