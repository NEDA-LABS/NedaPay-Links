"use client";

import { useState, useEffect, useMemo } from "react";
import { useAccount } from "wagmi";
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
import SwapModal from "./SwapModal";
import Footer from "../components/Footer";
import { BasenameDisplay } from "../components/WalletSelector";

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

  const total = processed.reduce(
    (sum, coin) => {
      const balanceNum = parseFloat(coin.balance.replace(/,/g, "")) || 0;
      return sum + balanceNum;
    },
    0
  );

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
  const { address, isConnected, connector } = useAccount();
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

  // Memoized provider to avoid reinitialization
  const provider = useMemo(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
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
    return (address.startsWith("0x") ? address : `0x${address}`) as `0x${string}`;
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
      ((selectedWalletType === "eoa" && address && connector) ||
        (selectedWalletType === "smart" &&
          smartWalletAddress &&
          smartWalletAddress !== address &&
          connector))
    ) {
      fetchRealBalances(selectedWalletAddress!);
    }
  }, [
    isConnected,
    selectedWalletAddress,
    connector,
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
        const currentTxHashes: Set<string> = new Set(transactions.map((tx: any) => tx.txHash));
  
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
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const lastTransaction = newTransactions[0];
  
          if (lastTransaction) {
            const shortSender = lastTransaction.wallet.slice(0, 6) + "..." + lastTransaction.wallet.slice(-4);
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
    if (!mounted) return;

    // Check if wallet is connected via localStorage
    const walletConnected = localStorage.getItem("walletConnected") === "true";
    const cookieWalletConnected =
      document.cookie.includes("wallet_connected=true");

    // If not connected, redirect to home
    if (!walletConnected && !cookieWalletConnected) {
      router.push("/?walletRequired=true");
    } else if (walletConnected && !cookieWalletConnected) {
      // Sync localStorage to cookie
      document.cookie = "wallet_connected=true; path=/; max-age=86400"; // 24 hours
    } else if (cookieWalletConnected && !walletConnected) {
      // Sync cookie to localStorage
      localStorage.setItem("walletConnected", "true");
    }
  }, [mounted, router]);

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
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-white dark:bg-gray-900 dark:text-white">
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
          <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-100">
                    Merchant Dashboard
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-base">
                    Manage your stablecoin payments and track business performance
                  </p>
                </div>
                {isTransactionLoading && (
                  <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/30 px-4 py-2 rounded-lg">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-blue-600 dark:text-blue-300">
                      Loading data...
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-lg shadow-lg transform transition-all duration-500 hover:scale-102 hover:shadow-xl">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h2 className="text-white text-xl font-bold mb-2 animate-fadeIn flex items-center gap-1">
                      {(() => {
                        const hour = new Date().getHours();
                        if (hour < 12) return "☀️ Good Morning";
                        if (hour < 18) return "🌤️ Good Afternoon";
                        return "🌙 Good Evening";
                      })()}
                      {selectedWalletAddress && (
                        <div className="text-xl font-bold">
                          <BasenameDisplay 
                            address={selectedWalletAddress}
                            basenameClassName="text-xl font-bold"
                            isMobile={false}
                          />
                        </div>
                      )}
                    </h2>
                    <p className="text-white text-opacity-90 animate-fadeIn animation-delay-200">
                      {(() => {
                        const messages = [
                          "Today is a great day to grow your business with NEDA Pay!",
                          "Your dashboard is looking great! Ready to accept more payments?",
                          "Crypto payments made simple - that's the NEDA Pay promise!",
                          "Need help? We're just a click away to support your business journey.",
                          "Your success is our success. Let's make today count!",
                        ];
                        return messages[Math.floor(Math.random() * messages.length)];
                      })()}
                    </p>
                    <div className="global mt-3 flex space-x-3 animate-fadeIn animation-delay-300">
                      <button
                        onClick={() => {
                          setIsLoadingPaymentLink(true);
                          router.push("/payment-link");
                        }}
                        className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2"
                        disabled={isLoadingPaymentLink}
                      >
                        {isLoadingPaymentLink ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          "Create Payment Link"
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setIsLoadingSettings(true);
                          router.push("/settings");
                        }}
                        className="px-4 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2"
                        disabled={isLoadingSettings}
                      >
                        {isLoadingSettings ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          "Customize Dashboard"
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="hidden md:block animate-pulse">
                    <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                      <span className="text-3xl">💰</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary dark:bg-primary-dark border border-primary-light dark:border-blue-800 rounded-xl p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-2">
              Wallet Connected
              </h2>
              <p className="text-white mb-4">
              Your wallet is connected and ready to use
              </p>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium text-black dark:text-white">
                Wallet Address:
                </div>
                <div className="global text-sm text-white/90">                 
                  {selectedWalletAddress && (
                    <span className="inline-flex items-center gap-2">
                      {`${selectedWalletAddress.substring(
                        0,
                        10
                      )}...${selectedWalletAddress.substring(
                        selectedWalletAddress.length - 8
                      )}`}
                      <button
                        className="ml-1 rounded bg-slate-600 text-xs text-white hover:bg-slate-800 focus:outline-none"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedWalletAddress);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1200);
                        }}
                        title="Copy address"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </span>
                  )}
                  {selectedWalletType !== "smart" &&
                    !selectedWalletAddress &&
                    "Not Connected"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Total Received
                </div>
                <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
                  {isBalanceLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                      <span className="text-sm text-blue-600 dark:text-blue-300">
                        Loading balances...
                      </span>
                    </div>
                  ) : balanceError ? (
                    <span className="text-red-600 dark:text-red-400">N/A</span>
                  ) : (
                    (() => {
                      const processed =
                        processBalances(balances).processedBalances;
                      const nonZero = processed.filter(
                        (c) => parseFloat(c.balance.replace(/,/g, "")) > 0
                      );
                      if (!nonZero.length) return "0";
                      return nonZero.map((c) => (
                        <div key={c.symbol} className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span className="font-semibold">{c.balance}</span>
                          <span className="ml-1">{c.symbol}</span>
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Total Transactions
                </div>
                <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
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
                          flag: coin?.flag || "🌐",
                        };
                      }
                      grouped[symbol].count++;
                    });
                    const entries = Object.entries(grouped).filter(
                      ([sym, data]) => data.count > 0
                    );
                    if (!entries.length) return "0";
                    return entries.map(([symbol, data]) => (
                      <div key={symbol} className="flex items-center gap-2">
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
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Average Transaction
                </div>
                <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
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
                          flag: coin?.flag || "🌐",
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
                      <div key={symbol} className="flex items-center gap-2">
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
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Monthly Growth
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
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
                    return `${sign}${growth.toFixed(1)}%`;
                  })()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="text-sm text-slate-700 dark:text-slate-300 mb-1 font-semibold">
                  Payment Methods
                </div>
                <div className="flex flex-col gap-1 text-2xl font-bold text-slate-900 dark:text-white">
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
                        <div key={symbol} className="flex items-center gap-2">
                          <span>{coin?.flag || "🌐"}</span>
                          <span className="font-semibold">{symbol}</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8 dark:text-white">
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg dark:text-white">
    <div className="flex justify-between items-center mb-4 dark:text-white">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
        Daily Revenue
      </h3>
      <select
        className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white w-auto"
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value)}
      >
        <option value="all" className="text-slate-800 dark:text-white">
          All Currencies
        </option>
        {stablecoins.map((coin: any) => (
          <option
            key={coin.baseToken}
            value={coin.baseToken}
            className="text-slate-800 dark:text-white"
          >
            {coin.flag} {coin.baseToken}
          </option>
        ))}
      </select>
    </div>
    <div className="relative h-48 sm:h-64 max-w-full overflow-x-auto scroll-smooth">
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="w-full min-w-[300px]">
        <ChartComponent
          transactions={
            selectedCurrency === "all"
              ? transactions
              : transactions.filter((tx: any) => tx.currency === selectedCurrency)
          }
        />
      </div>
    </div>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
        Payment Methods
      </h3>
      <select
        className="border rounded px-1 sm:px-2 py-0.5 sm:py-1 text-xs sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white w-auto"
        value={selectedCurrency}
        onChange={(e) => setSelectedCurrency(e.target.value)}
      >
        <option value="all" className="text-slate-800 dark:text-white">
          All Currencies
        </option>
        {stablecoins.map((coin: any) => (
          <option
            key={coin.baseToken}
            value={coin.baseToken}
            className="text-slate-800 dark:text-white"
          >
            {coin.flag} {coin.baseToken}
          </option>
        ))}
      </select>
    </div>
    <div className="relative h-48 sm:h-64 max-w-full overflow-x-auto scroll-smooth">
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="w-full min-w-[300px]">
        <PieComponent
          transactions={
            selectedCurrency === "all"
              ? transactions
              : transactions.filter((tx: any) => tx.currency === selectedCurrency)
          }
        />
      </div>
    </div>
  </div>
</div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
  <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30">
      <div className="flex justify-between items-center">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          <svg
            className="w-4 sm:w-5 h-4 sm:h-5 mr-2 text-indigo-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
          Recent Transactions
        </h3>
        <select
          value={selectedCurrency}
          onChange={(e) => setSelectedCurrency(e.target.value)}
          className="border rounded px-2 py-1 text-xs sm:text-sm bg-white dark:bg-slate-700 text-slate-800 dark:text-white w-auto"
        >
          <option value="all" className="text-slate-800 dark:text-white">
            All Currencies
          </option>
          {stablecoins.map((coin: any) => (
            <option
              key={coin.baseToken}
              value={coin.baseToken}
              className="text-slate-800 dark:text-white"
            >
              {coin.flag} {coin.baseToken}
            </option>
          ))}
        </select>
      </div>
    </div>
    <div className="relative overflow-x-auto overflow-y-hidden scroll-smooth">
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead className="bg-slate-50 dark:bg-slate-700">
          <tr>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-[100px]">
              Tx Hash
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-[100px]">
              Sender
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-[120px]">
              Date
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-[80px]">
              Amount
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-300 uppercase tracking-wider max-w-[80px]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {isTransactionLoading ? (
            Array(5)
              .fill(0)
              .map((_, index) => (
                <tr key={`loading-${index}`} className="animate-pulse">
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <div className="h-4 w-14 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </td>
                </tr>
              ))
          ) : (selectedCurrency === "all"
              ? transactions
              : transactions.filter(
                  (tx: any) => tx.currency === selectedCurrency
                )
            ).length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-2 sm:px-6 py-6 sm:py-10 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
              >
                <div className="global flex flex-col items-center justify-center space-y-2">
                  <svg
                    className="w-8 sm:w-12 h-8 sm:h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p>No transactions found</p>
                  <button
                    onClick={() => router.push("/payment-link")}
                    className="mt-2 inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
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
                  (tx: any) => tx.currency === selectedCurrency
                )
            ).map((tx, index) => (
              <tr
                key={tx.id}
                className={`hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors duration-150 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-slate-50 dark:bg-gray-750"
                }`}
              >
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[100px]">
                  <a
                    href={tx.blockExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center text-xs sm:text-sm"
                  >
                    <span className="mr-1 text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 py-0.5 px-1 sm:px-2 rounded-md">
                      <svg
                        className="w-2 sm:w-3 h-2 sm:h-3 inline mr-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Tx
                    </span>
                    <span className="truncate">{tx.shortId}</span>
                  </a>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[100px]">
                  <a
                    href={`https://basescan.org/address/${tx.sender}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium flex items-center text-xs sm:text-sm"
                  >
                    <span className="inline-block w-4 sm:w-6 h-4 sm:h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 mr-1 sm:mr-2 flex items-center justify-center text-[8px] sm:text-xs">
                      <svg
                        className="w-2 sm:w-3 h-2 sm:h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </span>
                    <span className="truncate">{tx.senderShort}</span>
                  </a>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[120px] text-xs sm:text-sm">
                  <div className="flex items-center text-slate-800 dark:text-slate-200">
                    <svg
                      className="w-3 sm:w-4 h-3 sm:h-4 text-slate-500 dark:text-slate-400 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {tx.date}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                  <div className="font-medium text-xs sm:text-sm">
                    <span className="text-green-600 dark:text-green-400 font-bold">
                      {tx.amount}
                    </span>
                    <span className="ml-1 text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {tx.currency}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                  <span
                    className={`px-2 sm:px-3 py-1 inline-flex items-center text-[10px] sm:text-xs font-medium rounded-full ${
                      tx.status === "Completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                        : tx.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-green-800"
                    }`}
                  >
                    <svg
                      className="w-2 sm:w-3 h-2 sm:h-3 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {tx.status === "Completed" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      ) : tx.status === "Pending" ? (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      ) : (
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      )}
                    </svg>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/20 dark:to-purple-900/20">
      <div className="flex justify-center">
        <a
          href="/transactions"
          className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-800/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <svg
            className="w-3 sm:w-4 h-3 sm:h-4 mr-1 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          View All Transactions
        </a>
      </div>
    </div>
  </div>
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform hover:shadow-xl">
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30">
      <h2 className="text-base sm:text-xl font-semibold text-gray-900 dark:text-white flex items-center">
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
      <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-l from-gray-100 dark:from-gray-800 to-transparent pointer-events-none"></div>
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="">
          <tr>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider max-w-[120px]">
              Coin
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider max-w-[80px]">
              Balance
            </th>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider max-w-[80px]">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="global divide-y divide-gray-200 dark:divide-gray-700">
          {processedBalances.map((coin: any, index: any) => {
            const balanceNum = parseFloat(
              String(coin.balance).replace(/,/g, "")
            );
            const hasBalance = balanceNum > 0;

            return (
              <tr
                key={coin.symbol}
                className={`hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-750"
                }`}
              >
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[120px]">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-6 sm:h-8 w-6 sm:w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-base sm:text-lg">
                      {coin.flag}
                    </div>
                    <div className="ml-2 sm:ml-4">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {coin.symbol}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                        {coin.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                  <div
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      hasBalance
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {coin.balance}
                  </div>
                </td>
                <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-normal max-w-[80px]">
                  <button
                    className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 border border-transparent text-[10px] sm:text-xs font-medium rounded-md shadow-sm bg-blue-500 text-white hover:bg-blue-600 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => hasBalance && handleSwapClick(coin.symbol)}
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
                  processedBalances.find((b: any) => b.symbol === swapFromSymbol)
                    ?.balance || "0"
                }
              />
            )}
          </div>
          {/* Quick Actions */}
            <div className="global bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg max-w-md mx-auto" style={{width: "79%"}}>
            <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quick Actions</h3>
            
            <div className="space-y-4">
              <button 
                onClick={() => {
                  setIsLoadingPaymentLink(true);
                  document.cookie = 'wallet_connected=true; path=/; max-age=86400';
                  setTimeout(() => {
                    window.location.href = '/payment-link';
                  }, 100);
                }} 
                className="p-4 w-full bg-gray-100 dark:bg-blue-900/30 rounded-lg border border-blue-300 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition flex flex-col items-start gap-2"
                disabled={isLoadingPaymentLink}
              >
                {isLoadingPaymentLink ? (
                  <>
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="font-bold text-blue-900 dark:text-blue-300">Processing...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-blue-900 dark:text-blue-300">Create Payment Link</p>
                    <p className="text-sm text-blue-900 dark:text-blue-400 mt-1 font-medium">Generate a payment link to share with customers</p>
                  </>
                )}
              </button>

              <button 
                onClick={() => {
                  setIsLoadingInvoice(true);
                  router.push('/invoice');
                }} 
                className="p-4 w-full bg-gray-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/50 transition flex flex-col items-start gap-2"
                disabled={isLoadingInvoice}
              >
                {isLoadingInvoice ? (
                  <>
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="font-bold text-green-900 dark:text-green-300">Processing...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-green-900 dark:text-green-300">Generate Invoice</p>
                    <p className="text-sm text-green-900 dark:text-green-400 mt-1 font-medium">Send an invoice to your customer for payment</p>
                  </>
                )}
              </button>

              <button 
                onClick={() => {
                  setIsLoadingAnalytics(true);
                  router.push('/analytics');
                }} 
                className="p-4 w-full bg-gray-100 dark:bg-purple-900/30 rounded-lg border border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition flex flex-col items-start gap-2"
                disabled={isLoadingAnalytics}
              >
                {isLoadingAnalytics ? (
                  <>
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <p className="font-bold text-purple-900 dark:text-purple-300">Processing...</p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-purple-900 dark:text-purple-300">View Analytics</p>
                    <p className="text-sm text-purple-900 dark:text-purple-400 mt-1 font-medium">Detailed reports and business insights</p>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
