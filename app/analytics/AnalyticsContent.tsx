"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { stablecoins } from "../data/stablecoins";
import { ethers } from "ethers";
import CurrencyFilter from "./CurrencyFilter";
import { exportTransactionsToCSV } from "./ExportCSV";
import Footer from "../components/Footer";
import { useTheme } from "next-themes";
import { RevenueLineChart, TransactionsBarChart, CurrencyDoughnutChart } from "./Charts";

// Multicall3 contract ABI (minimal)
const MULTICALL3_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)",
];

// Multicall3 contract address on Base Mainnet
const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

// ERC20 ABI for balance and decimals
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

// Process balances (reused from MerchantDashboard)
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
      const balanceNum = parseFloat(coin.balance) || 0;
      return sum + balanceNum;
    },
    0
  );

  const processedCoins = processed.map((coin) => {
    const balanceNum = parseFloat(coin.balance) || 0;
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

// Fetch transactions from the database (aligned with MerchantDashboard)
const fetchTransactionsFromDB = async (
  walletAddress: string | undefined,
  setTransactions: (txs: any[]) => void,
  setIsTransactionLoading: (loading: boolean) => void
) => {
  if (!walletAddress) return;
  setIsTransactionLoading(true);
  try {
    const response = await fetch(
      `/api/transactions?merchantId=${walletAddress}`
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
    console.log("Fetched transactions:", formattedTransactions);
    setTransactions(formattedTransactions);
  } catch (error) {
    console.error("Error fetching transactions from DB:", error);
    setTransactions([]);
  } finally {
    setIsTransactionLoading(false);
  }
};

// Get payment methods data for Doughnut chart
const getPaymentMethodsData = (balances: Record<string, string>) => {
  const labels = Object.keys(balances).filter(
    (key) => parseFloat(balances[key]) > 0
  );
  const data = labels.map((key) => parseFloat(balances[key]));
  return {
    labels,
    datasets: [
      {
        label: "Currency Distribution",
        data,
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // Blue
          "rgba(139, 92, 246, 0.8)", // Purple
          "rgba(79, 70, 229, 0.8)", // Indigo
          "rgba(255, 255, 255, 0.8)", // White
        ],
        borderColor: [
          "rgb(59, 130, 246)", // Blue
          "rgb(139, 92, 246)", // Purple
          "rgb(79, 70, 229)", // Indigo
          "rgb(255, 255, 255)", // White
        ],
        borderWidth: 1,
      },
    ],
  };
};

export default function AnalyticsContent() {
  const [dateRange, setDateRange] = useState("7d");
  const { user, authenticated } = usePrivy();
  const address = user?.wallet?.address;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransactionLoading, setIsTransactionLoading] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  const { theme } = useTheme();

  useEffect(() => {
    setIsDarkMode(theme === "dark");
    console.log("AnalyticsContent isDarkMode:", theme === "dark");
  }, [theme]);

  // Memoized provider
  const provider = useMemo(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new ethers.providers.Web3Provider(window.ethereum);
    }
    return new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
  }, []);

  // Wallet connection check
  useEffect(() => {
    if (typeof window !== "undefined") {
      const walletConnected = localStorage.getItem("walletConnected") === "true";
      const cookieWalletConnected = document.cookie.includes(
        "wallet_connected=true"
      );

      if (!authenticated && !walletConnected && !cookieWalletConnected) {
        router.push("/?walletRequired=true");
      }
    }
  }, [authenticated, router]);

  // Fetch balances and transactions
  useEffect(() => {
    async function fetchData() {
      if (!address) {
        console.log("No wallet address connected");
        return;
      }
      setIsLoading(true);
      setIsTransactionLoading(true);
      setError(null);

      // Fetch balances using Multicall3
      try {
        const network = await provider.getNetwork();
        if (network.chainId !== 8453) {
          setError("Please switch to Base Mainnet (chainId 8453)");
          setBalances({});
          return;
        }

        const filteredCoins = stablecoins.filter(
          (coin) =>
            coin.chainId === 8453 &&
            coin.address &&
            /^0x[a-fA-F0-9]{40}$/.test(coin.address)
        );

        if (!filteredCoins.length) {
          setBalances({});
          return;
        }

        const calls = filteredCoins.flatMap((coin) => [
          {
            target: coin.address,
            allowFailure: true,
            callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
              "balanceOf",
              [address]
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

        filteredCoins.forEach((coin, index) => {
          const balanceResult = results[index * 2];
          const decimalsResult = results[index * 2 + 1];

          if (!balanceResult.success || !decimalsResult.success) {
            realBalances[coin.baseToken] = "0";
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
            realBalances[coin.baseToken] = parseFloat(formatted).toFixed(2);
          } catch (err) {
            realBalances[coin.baseToken] = "0";
          }
        });

        console.log("Fetched balances:", realBalances);
        setBalances(realBalances);
      } catch (e) {
        console.error("Balance fetch error:", e);
        setError("Failed to load balances. Please try again.");
        setBalances({});
      }

      // Fetch transactions
      await fetchTransactionsFromDB(address, setTransactions, setIsTransactionLoading);

      setIsLoading(false);
    }
    if (authenticated && address) fetchData();
  }, [authenticated, address, provider]);

  // Date range filtering
  const now = new Date();
  const getDateThreshold = () => {
    if (dateRange === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (dateRange === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (dateRange === "90d") return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return new Date(0); // All time
  };
  const dateThreshold = getDateThreshold();
  const getPreviousThreshold = () => {
    if (dateRange === "7d") return new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    if (dateRange === "30d") return new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    if (dateRange === "90d") return new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    return new Date(0);
  };
  const previousThreshold = getPreviousThreshold();

  const filteredTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const currencyMatch = !selectedCurrency || tx.currency === selectedCurrency;
    return txDate >= dateThreshold && currencyMatch;
  });

  const previousTxs = transactions.filter((tx) => {
    const txDate = new Date(tx.date);
    const currencyMatch = !selectedCurrency || tx.currency === selectedCurrency;
    return txDate >= previousThreshold && txDate < dateThreshold && currencyMatch;
  });

  const filteredBalances = selectedCurrency
    ? Object.fromEntries(
        Object.entries(balances).filter(([k]) => k === selectedCurrency)
      )
    : balances;
  const { processedBalances, totalReceived, processedStablecoins } =
    processBalances(filteredBalances);

  // Compute percentage changes
  const computePercentageChange = (currentValue: number, previousValue: number) => {
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  const currentRevenue = filteredTxs.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || "0"),
    0
  );
  const previousRevenue = previousTxs.reduce(
    (sum, tx) => sum + parseFloat(tx.amount || "0"),
    0
  );
  const revenueChange = computePercentageChange(currentRevenue, previousRevenue);

  const currentTxCount = filteredTxs.length;
  const previousTxCount = previousTxs.length;
  const txCountChange = computePercentageChange(currentTxCount, previousTxCount);

  const currentAvg = filteredTxs.length > 0 ? currentRevenue / filteredTxs.length : 0;
  const previousAvgTx = previousTxs.length > 0 ? previousRevenue / previousTxs.length : 0;
  const avgTxChange = computePercentageChange(currentAvg, previousAvgTx);

  console.log("Filtered transactions:", filteredTxs);
  console.log("Current revenue:", currentRevenue, "Previous revenue:", previousRevenue);
  console.log("Current tx count:", currentTxCount, "Previous tx count:", previousTxCount);

  // Chart data
  const revenueData = {
    labels: filteredTxs.map((tx) => tx.date),
    datasets: [
      {
        label: "Revenue",
        data: filteredTxs.map((tx) => Number(tx.amount)),
        borderColor: "rgb(59, 130, 246)", // Blue
        backgroundColor: "rgba(59, 130, 246, 0.5)",
        tension: 0.3,
      },
    ],
  };

  const transactionsData = { transactions: filteredTxs };
  console.log("transactionsData for Bar chart:", transactionsData);

  const currencyDistributionData = getPaymentMethodsData(filteredBalances);

  console.log("darkmode analytics page:", isDarkMode);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      {/* <div className="my-6 px-4">
        <button
          onClick={() => window.history.back()}
          className="!bg-indigo-600 !rounded-lg px-4 py-2 text-white font-medium hover:!bg-indigo-700 transition-colors"
        >
          <span aria-hidden="true">←</span> Back
        </button>
      </div> */}
      <div className="flex-grow">
        {!authenticated || !address ? (
          <div className="container mx-auto max-w-7xl px-4 py-12">
            <p className="text-red-500 font-medium">Please connect your wallet to view analytics.</p>
          </div>
        ) : (
          <div className="container mx-auto max-w-7xl px-4 py-12">
            {error && <div className="text-red-500 font-medium mb-6">{error}</div>}
            {/* Controls */}
            <div className="flex flex-wrap gap-4 items-center mb-8">
              <CurrencyFilter
                currencies={[...new Set(transactions.map((tx) => tx.currency))].filter(Boolean)}
                selected={selectedCurrency}
                onChange={setSelectedCurrency}
              />
              <button
                className="!bg-blue-600 !rounded-lg px-4 py-2 text-white font-medium hover:!bg-blue-700 transition-colors disabled:!bg-blue-300"
                onClick={() => exportTransactionsToCSV(filteredTxs)}
                disabled={filteredTxs.length === 0}
              >
                Export to CSV
              </button>
            </div>
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-blue-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 text-base">
                Comprehensive insights and reports for your business
              </p>
            </div>

            {/* Date range selector */}
            <div className="mb-8">
              <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
                {["7d", "30d", "90d", "all"].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setDateRange(range)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      dateRange === range
                        ? "!bg-purple-600 !text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    } ${
                      range === "7d" ? "!rounded-l-lg" : range === "all" ? "!rounded-r-lg" : ""
                    } border-r border-gray-200 last:border-r-0`}
                  >
                    {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : range === "90d" ? "90 Days" : "All Time"}
                  </button>
                ))}
              </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Total Revenue
                </h3>
                {isTransactionLoading ? (
                  <p className="text-sm text-blue-600">Loading...</p>
                ) : !transactions.length ? (
                  <p className="text-3xl font-bold text-blue-600">0</p>
                ) : (
                  (() => {
                    const sums: Record<string, number> = {};
                    filteredTxs.forEach((tx) => {
                      const amt = parseFloat(tx.amount || "0");
                      sums[tx.currency] = (sums[tx.currency] || 0) + amt;
                    });
                    const entries = Object.entries(sums);
                    if (entries.length === 1) {
                      const [currency, sum] = entries[0];
                      return (
                        <p className="text-3xl font-bold text-blue-600">
                          {sum.toLocaleString()} {currency}
                        </p>
                      );
                    }
                    return (
                      <div>
                        {entries.map(([currency, sum]) => (
                          <div
                            key={currency}
                            className="text-sm text-blue-600 font-semibold"
                          >
                            {sum.toLocaleString()} {currency}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
                <p
                  className={`text-sm mt-2 flex items-center ${
                    revenueChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        revenueChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {revenueChange.toFixed(1)}% from last period
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Transactions
                </h3>
                {isTransactionLoading ? (
                  <p className="text-sm text-blue-600">Loading...</p>
                ) : (
                  <p className="text-3xl font-bold text-blue-600">{filteredTxs.length}</p>
                )}
                <p
                  className={`text-sm mt-2 flex items-center ${
                    txCountChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        txCountChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {txCountChange.toFixed(1)}% from last period
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Average Transaction
                </h3>
                {isTransactionLoading ? (
                  <p className="text-sm text-blue-600">Loading...</p>
                ) : !filteredTxs.length ? (
                  <p className="text-3xl font-bold text-blue-600">0</p>
                ) : (
                  (() => {
                    const sums: Record<string, { sum: number; count: number }> = {};
                    filteredTxs.forEach((tx) => {
                      const amt = parseFloat(tx.amount || "0");
                      if (!sums[tx.currency]) sums[tx.currency] = { sum: 0, count: 0 };
                      sums[tx.currency].sum += amt;
                      sums[tx.currency].count += 1;
                    });
                    const entries = Object.entries(sums);
                    if (entries.length === 1) {
                      const [currency, { sum, count }] = entries[0];
                      return (
                        <p className="text-3xl font-bold text-blue-600">
                          {(sum / count).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}{" "}
                          {currency}
                        </p>
                      );
                    }
                    return (
                      <div>
                        {entries.map(([currency, { sum, count }]) => (
                          <div
                            key={currency}
                            className="text-sm text-blue-600 font-semibold"
                          >
                            {(sum / count).toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}{" "}
                            {currency}
                          </div>
                        ))}
                      </div>
                    );
                  })()
                )}
                <p
                  className={`text-sm mt-2 flex items-center ${
                    avgTxChange >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d={
                        avgTxChange >= 0
                          ? "M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0112 7z"
                          : "M12 13a1 1 0 110 2h-5a1 1 0 01-1-1V9a1 1 0 112 0v2.586l-4.293-4.293a1 1 0 01-1.414 0L16 9.586l4.293-4.293a1 1 0 011.414 1.414l-5 5a1 1 0 01-1.414 0L13 9.414l-3.293 3.293A1 1 0 0112 13z"
                      }
                      clipRule="evenodd"
                    />
                  </svg>
                  {avgTxChange.toFixed(1)}% from last period
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Revenue Over Time
                </h3>
                {isTransactionLoading ? (
                  <p className="text-sm text-blue-600 text-center">Loading...</p>
                ) : (
                  <div className="h-64">
                    <RevenueLineChart data={revenueData} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Transactions Per Day
                </h3>
                {isTransactionLoading ? (
                  <p className="text-sm text-blue-600 text-center">Loading...</p>
                ) : (
                  <div className="h-64">
                    <TransactionsBarChart data={transactionsData} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Currency Distribution
                </h3>
                {isLoading ? (
                  <p className="text-sm text-blue-600 text-center">Loading...</p>
                ) : (
                  <div className="h-64">
                    <CurrencyDoughnutChart data={currencyDistributionData} />
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  Transaction History
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Currency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {isTransactionLoading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : filteredTxs.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-6 py-4 text-center text-gray-500"
                          >
                            No transactions found
                          </td>
                        </tr>
                      ) : (
                        filteredTxs.map((tx, idx) => (
                          <tr key={tx.id || idx}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.amount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {tx.currency}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="mt-4 text-sm text-gray-600">
                    Showing {filteredTxs.length} of {transactions.length} transactions
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}