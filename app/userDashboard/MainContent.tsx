import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "@/data/stablecoins";
import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import SwapModal from "@/dashboard/SwapModal";
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
        // Filter stablecoins for Base chain
        const baseStablecoins = stablecoins.filter((coin) => coin.chainIds.includes(8453));

        // Prepare calls for balanceOf and decimals
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

        // Execute multicall
        const results = await multicallContract.aggregate3(calls);

        // Process results
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

        // Create processed balances array
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

  // Fetch transactions
  useEffect(() => {
    if (!walletAddress) return;

    const fetchTransactions = async () => {
      setIsTransactionLoading(true);
      try {
        const response = await fetch(`/api/transactions?merchantId=${walletAddress}`);
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();

        // Format transactions
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

        // Calculate metrics
        const successfulTxs = formattedTransactions.filter((tx) => tx.status === "Completed");
        const totalReceived = successfulTxs.reduce((sum, tx) => sum + tx.amount, 0);
        const totalTransactions = successfulTxs.length;
        const averageTransaction = totalTransactions > 0 ? totalReceived / totalTransactions : 0;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthTxs = successfulTxs.filter((tx) => {
          const txDate = tx.rawDate;
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        });

        const lastMonthTxs = successfulTxs.filter((tx) => {
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
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      } finally {
        setIsTransactionLoading(false);
      }
    };

    fetchTransactions();
  }, [walletAddress]);

  // Handle swap click
  const handleSwapClick = (fromSymbol: string) => {
    setSwapFromSymbol(fromSymbol);
    setSwapModalOpen(true);
  };

  // Handle swap (placeholder)
  const handleSwap = (from: string, to: string, amount: string) => {
    setSwapModalOpen(false);
    console.log(`Swapping ${amount} ${from} to ${to}`);
  };

  // Gradient class for stablecoin icons
  const getGradientClass = (index: number) => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-green-500 to-emerald-600";
      case 1:
        return "bg-gradient-to-br from-blue-500 to-cyan-600";
      case 2:
        return "bg-gradient-to-br from-yellow-500 to-orange-600";
      case 3:
        return "bg-gradient-to-br from-purple-500 to-pink-600";
      default:
        return "bg-gradient-to-br from-indigo-500 to-violet-600";
    }
  };

  return (
      <div className="space-y-8 bg-slate-100 p-4">
       <Header />
      <div className="flex items-center justify-between">
        <div>
        
        <button></button>
          <h1 className="text-4xl font-bold bg-[#3E55E6] bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-lg text-slate-800 text-muted-foreground mt-2">
            Seamlessly manage stablecoin payments and monitor your business performance
          </p>
        </div>
        {/* <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-slate-800">
            <Download className="h-4 w-4 text-slate-800" />
            Export
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            <Sparkles className="h-4 w-4" />
            Quick Actions
          </Button>
        </div> */}
      </div>

      {/* Hero Welcome Section */}
      <Card className="relative border-0 bg-[#3E55E6] text-white shadow-2xl">
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {authenticated ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                      <p className="text-white/80">Ready to manage your payments</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-white/90">Status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">Connected</p>
                        <Badge className="text-xs px-2 py-0.5 bg-white/10 border border-white/20">
                          {walletType?.toUpperCase() || "UNKNOWN"}
                        </Badge>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                      <div className="text-sm text-white/70 mb-2">Wallet</div>
                      <div className="flex items-center gap-2">
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
            {/* {wallet kit} */}
            <WalletKit/>
            {/* <div className="bg-white/5 rounded-2xl p-6 border border-white/20 text-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <StablecoinBalanceButton />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Send
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Receive
                    </Button>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground text-slate-800">Transaction Overview</h2>
          {/* <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button> */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Received"
            value={metrics.totalReceived.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            subtitle="USDC"
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
            subtitle="USDC"
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

      {/* Analytics & Insights */}
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

      {/* Stablecoin Balances */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Stablecoin Balances</CardTitle>
            <p className="text-sm text-muted-foreground mt-1 text-slate-800">Manage your crypto assets</p>
          </div>
          <div className="flex gap-2">
            {/* <Button variant="outline" size="sm" className="gap-2 text-slate-800">
              <Download className="h-4 w-4" />
              Export
            </Button> */}
            {/* <Button size="sm" className="gap-2 text-slate-800">
              <Shield className="h-4 w-4" />
              Secure Wallet
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          {isBalanceLoading ? (
            <p className="text-center py-12 text-slate-800">Loading balances...</p>
          ) : stablecoinBalances.length === 0 ? (
            <p className="text-center py-12 text-slate-800">No stablecoins found</p>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground pb-3 border-b border-border/50">
                <div className="col-span-5 text-slate-800">COIN</div>
                <div className="col-span-3 text-slate-800">BALANCE</div>
                <div className="col-span-2 text-slate-800">ACTION</div>
                {/* <div className="col-span-2 text-right text-slate-800">MANAGE</div> */}
              </div>
              {stablecoinBalances.map((coin, index) => (
                <div
                  key={coin.symbol}
                  className="grid grid-cols-12 gap-4 items-center py-4 hover:bg-muted/30 rounded-xl transition-all duration-200 px-2"
                >
                  <div className="col-span-5 flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${getGradientClass(index)}`}
                    >
                      {coin.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-foreground text-slate-800">{coin.symbol}</div>
                      <div className="text-sm text-muted-foreground text-slate-800">{coin.name}</div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    <div className="font-bold text-lg text-slate-800">{coin.balance}</div>
                    <div className="text-xs text-muted-foreground text-slate-800">Available</div>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 w-full text-slate-800"
                      onClick={() => handleSwapClick(coin.symbol)}
                      disabled={parseFloat(coin.balance.replace(/,/g, "")) <= 0}
                    >
                      <Repeat className="h-3 w-3" />
                      Swap
                    </Button>
                  </div>
                  {/* <div className="col-span-2 flex justify-end gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-800">
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-800">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div> */}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Swap Modal */}
      {swapModalOpen && (
        <SwapModal
          open={swapModalOpen}
          fromSymbol={swapFromSymbol}
          onClose={() => setSwapModalOpen(false)}
          onSwap={handleSwap}
          maxAmount={stablecoinBalances.find((b) => b.symbol === swapFromSymbol)?.balance || "0"}
        />
      )}
      <Footer/>
    </div>
  ); 
}