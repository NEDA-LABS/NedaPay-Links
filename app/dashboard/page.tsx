
"use client";
import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "@/data/stablecoins";
import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import SwapModal from "@/components/SwapModal";
import { PaymentMethods } from "./PaymentMethods";
import Header from "@/components/Header";
import {
  Activity,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Download,
  Wallet,
  Send,
  BarChart3,
  PieChart,
  ExternalLink,
  Copy,
  Sparkles,
  Zap,
  Globe,
  Shield,
  Repeat,
  Menu,
  ChevronLeft,
} from "lucide-react";
import DailyRevenueChart from "./DailyRevenueChart";
import Footer from "@/components/Footer";
import ChainSwitcher from "@/components/ChainSwitcher";
import WalletKit from "./WalletKit";
import { SidebarProvider, useSidebar } from "@/compliance/user/components/ui/sidebar";

// Define ABIs and constants
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const MULTICALL3_ABI = [
  "function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[] returnData)",
];

const MULTICALL3_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
const BASE_RPC_URL = "https://mainnet.base.org";

// Define type for stablecoin balance
type StablecoinBalance = {
  symbol: string;
  name: string;
  balance: string;
  flag: string;
  region: string;
};

// Define type for transaction
type Transaction = {
  id: string;
  shortId: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  rawDate: Date;
  blockExplorerUrl: string;
};

export default function DashboardContent() {
  const { user, authenticated } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const walletType = user?.wallet?.walletClientType;

  // States
  const [stablecoinBalances, setStablecoinBalances] = useState<StablecoinBalance[]>([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(true);
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [metrics, setMetrics] = useState({
    totalReceived: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    monthlyGrowth: 0,
  });
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>("");

  // Set up provider and multicall contract
  const provider = useMemo(() => new ethers.providers.JsonRpcProvider(BASE_RPC_URL), []);
  const multicallContract = useMemo(
    () => new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider),
    [provider]
  );

  // Fetch balances when walletAddress changes
  useEffect(() => {
    if (!walletAddress) return;

    const fetchBalances = async () => {
      setIsBalanceLoading(true);
      try {
        const baseStablecoins = stablecoins.filter((coin) => coin.chainIds.includes(8453));
        const calls = baseStablecoins.flatMap((coin) => [
          {
            target: coin.addresses[8453],
            allowFailure: true,
            callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData("balanceOf", [walletAddress]),
          },
          {
            target: coin.addresses[8453],
            allowFailure: true,
            callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData("decimals", []),
          },
        ]);

        const results = await multicallContract.aggregate3(calls);
        const realBalances: Record<string, string> = {};
        baseStablecoins.forEach((coin, index) => {
          const balanceResult = results[index * 2];
          const decimalsResult = results[index * 2 + 1];

          if (balanceResult.success && decimalsResult.success) {
            try {
              const balance = ethers.utils.defaultAbiCoder.decode(["uint256"], balanceResult.returnData)[0];
              const decimals = ethers.utils.defaultAbiCoder.decode(["uint8"], decimalsResult.returnData)[0];
              const formatted = ethers.utils.formatUnits(balance, decimals);
              realBalances[coin.baseToken] = parseFloat(formatted).toLocaleString();
            } catch (err) {
              console.error(`Error processing ${coin.baseToken}:`, err);
            }
          }
        });

        const processedBalances = baseStablecoins.map((coin) => ({
          symbol: coin.baseToken,
          name: coin.name,
          balance: realBalances[coin.baseToken] || "0",
          flag: coin.flag,
          region: coin.region,
        }));

        setStablecoinBalances(processedBalances);
      } catch (error) {
        console.error("Error fetching balances:", error);
      } finally {
        setIsBalanceLoading(false);
      }
    };

    fetchBalances();
  }, [walletAddress, multicallContract]);

  // Fetch transactions and set initial selected stablecoin
  useEffect(() => {
    if (!walletAddress) return;

    const fetchTransactions = async () => {
      setIsTransactionLoading(true);
      try {
        const response = await fetch(`/api/transactions?merchantId=${walletAddress}`);
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();

        const formattedTransactions: Transaction[] = data.map((tx: any) => ({
          id: tx.txHash,
          shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
          date: new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16),
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          status: tx.status,
          sender: tx.wallet,
          senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
          rawDate: new Date(tx.createdAt),
          blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
        }));

        setTransactions(formattedTransactions);

        const uniqueStablecoins = Array.from(new Set(formattedTransactions.map(tx => tx.currency)));
        if (uniqueStablecoins.length > 0 && !selectedStablecoin) {
          setSelectedStablecoin(uniqueStablecoins[0]);
        }
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setIsTransactionLoading(false);
      }
    };

    fetchTransactions();
  }, [walletAddress]);

  // Calculate metrics based on selected stablecoin
  useEffect(() => {
    if (!selectedStablecoin || transactions.length === 0) return;

    const filteredTxs = transactions.filter(
      tx => tx.currency === selectedStablecoin && tx.status === "Completed"
    );
    const totalReceived = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = filteredTxs.length;
    const averageTransaction = totalTransactions > 0 ? totalReceived / totalTransactions : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTxs = filteredTxs.filter(tx => {
      const txDate = tx.rawDate;
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
    });

    const lastMonthTxs = filteredTxs.filter(tx => {
      const txDate = tx.rawDate;
      return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
    });

    const currentMonthTotal = currentMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const lastMonthTotal = lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);

    let monthlyGrowth = 0;
    if (lastMonthTotal > 0) {
      monthlyGrowth = ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
      monthlyGrowth = 100;
    }

    setMetrics({
      totalReceived,
      totalTransactions,
      averageTransaction,
      monthlyGrowth,
    });
  }, [transactions, selectedStablecoin]);

  // Handle swap click
  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  const handleSwap = (from: string, to: string, amount: string) => {
    setSwapModalOpen(false);
    console.log(`Swapping ${amount} ${from} to ${to}`);
  };

  const getGradientClass = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-br from-green-500 to-emerald-600";
      case 1: return "bg-gradient-to-br from-blue-500 to-cyan-600";
      case 2: return "bg-gradient-to-br from-yellow-500 to-orange-600";
      case 3: return "bg-gradient-to-br from-purple-500 to-pink-600";
      default: return "bg-gradient-to-br from-indigo-500 to-violet-600";
    }
  };

  return (
    <div className="space-y-8 bg-slate-100 px-2 lg:px-[]">
      <Header />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-[#3E55E6] bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-sm md:text-lg text-slate-800 text-muted-foreground mt-2">
            Seamlessly manage stablecoin payments and monitor your business performance
          </p>
        </div>
      </div>

      <Card className="relative border-0 bg-[#3E55E6] text-white shadow-2xl">
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {authenticated ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="!text-lg md:!text-2xl font-bold text-white">Welcome Back</h2>
                      <p className="text-sm text-white/80">Ready to manage your payments</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20 items-center justify-centerm my-auto">
                      <div className="flex items-center gap-2 items-center my-auto">
                        <p className="text-white font-mono text-sm">
                          {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white/70 hover:text-white"
                          onClick={() => navigator.clipboard.writeText(walletAddress || "")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <ChainSwitcher />
                      </div>
                    </div>
                    <WalletKit/>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Please Connect Wallet</h2>
                    <p className="text-white/80">Connect your wallet to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="!text-lg md:!text-2xl font-bold text-foreground text-slate-800">Transactions From Payment-Links, Overview</h2>
        </div>
        <div className="mb-4">
          <label htmlFor="stablecoin-select" className="mr-2 text-slate-800">Select Stablecoin:</label>
          <select
            id="stablecoin-select"
            value={selectedStablecoin}
            onChange={(e) => setSelectedStablecoin(e.target.value)}
            className="border rounded px-2 py-1 text-slate-800"
            disabled={isTransactionLoading || transactions.length === 0}
          >
            {Array.from(new Set(transactions.map(tx => tx.currency))).map(symbol => (
              <option key={symbol} value={symbol}>{symbol}</option>
            ))}
          </select> 
          <a href="/analytics" className="ml-2 text-blue-600 text-decoration-underline">More Details</a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Received"
            value={metrics.totalReceived.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            subtitle={selectedStablecoin}
            icon={<ArrowDownRight className="h-5 w-5" />}
            className="border-0 text-slate-800 bg-gradient-to-br from-green-950/20 to-emerald-950/20"
          />
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions.toString()}
            subtitle="Transactions"
            icon={<Activity className="h-5 w-5" />}
            className="border-0 text-slate-800 bg-gradient-to-br from-blue-950/20 to-cyan-950/20"
          />
          <MetricCard
            title="Average Transaction"
            value={metrics.averageTransaction.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            subtitle={selectedStablecoin}
            icon={<DollarSign className="h-5 w-5" />}
            className="border-0 text-slate-800 bg-gradient-to-br from-purple-950/20 to-violet-950/20"
          />
          <MetricCard
            title="Monthly Growth"
            value={`${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth.toFixed(1)}%`}
            icon={metrics.monthlyGrowth >= 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            trend={{
              value: `${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth.toFixed(1)}%`,
              isPositive: metrics.monthlyGrowth >= 0,
            }}
            className={`border-0 text-slate-800 bg-gradient-to-br ${
              metrics.monthlyGrowth >= 0
                ? "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                : "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
            }`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Daily Revenue</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 text-slate-800">Track your daily earnings</p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 text-slate-800">
              <BarChart3 className="h-4 w-4" />
              All Currencies
            </Button>
          </CardHeader>
          <CardContent>
            <DailyRevenueChart transactions={transactions} days={30} />
          </CardContent>
        </Card>
        <PaymentMethods transactions={transactions} />
      </div>

      {/* {swapModalOpen && (
        <SwapModal
          open={swapModalOpen}
          fromSymbol={swapFromSymbol}
          onClose={() => setSwapModalOpen(false)}
          onSwap={handleSwap}
          maxAmount={stablecoinBalances.find((b) => b.symbol === swapFromSymbol)?.balance || "0"}
        />
      )} */}
      {/* <Footer/> */}
    </div>
  );
}