import { MetricCard } from "./MetricCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
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
} from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { stablecoins } from "@/data/stablecoins";
import { useState, useEffect, useCallback } from "react";
import DailyRevenueChart from "./DailyRevenueChart";

const transactionData = [
  {
    id: "TX3001",
    sender: "0x5b5...4a1",
    date: "20 20:58, 30 10:53",
    amount: "$ USDC",
    status: "Complete",
  },
];
const stablecoinBalances = [
  {
    symbol: "USDT",
    name: "Tether USD Coin",
    balance: "4,896",
    action: "Send",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    balance: "0",
    action: "Send",
  },
  {
    symbol: "BUSD",
    name: "Binance USD Coin",
    balance: "0",
    action: "Send",
  },
  {
    symbol: "DAI",
    name: "DAI Stablecoin",
    balance: "0",
    action: "Send",
  },
];

export default function DashboardContent() {
  const { user, authenticated } = usePrivy();
  const walletAddress = user?.wallet?.address;
  const walletType = user?.wallet?.walletClientType;

  // State for transactions and loading
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalReceived: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    monthlyGrowth: 0,
  });

  // Fetch transactions function
  const fetchTransactions = useCallback(async () => {
    if (!walletAddress) return;
    
    setIsTransactionLoading(true);
    try {
      const response = await fetch(`/api/transactions?merchantId=${walletAddress}`);
      if (!response.ok) throw new Error("Failed to fetch transactions");
      const data = await response.json();
      
      // Format transactions with numeric amounts
      const formattedTransactions = data.map((tx: any) => ({
        id: tx.txHash,
        shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
        date: new Date(tx.createdAt).toISOString().replace("T", " ").slice(0, 16),
        amount: parseFloat(tx.amount), // Ensure numeric value
        currency: tx.currency,
        status: tx.status,
        sender: tx.wallet,
        senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
        rawDate: new Date(tx.createdAt), // Keep Date object for calculations
        blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
      }));
      
      setTransactions(formattedTransactions);
      calculateMetrics(formattedTransactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setTransactions([]);
    } finally {
      setIsTransactionLoading(false);
    }
  }, [walletAddress]);

  // Calculate metrics from transactions
  const calculateMetrics = (txs: any[]) => {
    // Successful transactions only
    const successfulTxs = txs.filter((tx) => tx.status === "Completed");

    // Total received
    const totalReceived = successfulTxs.reduce((sum, tx) => sum + tx.amount, 0);

    // Total transactions
    const totalTransactions = successfulTxs.length;

    // Average transaction
    const averageTransaction =
      totalTransactions > 0 ? totalReceived / totalTransactions : 0;

    // Monthly growth calculation
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTxs = successfulTxs.filter((tx) => {
      const txDate = tx.rawDate;
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    const lastMonthTxs = successfulTxs.filter((tx) => {
      const txDate = tx.rawDate;
      return (
        txDate.getMonth() === lastMonth &&
        txDate.getFullYear() === lastMonthYear
      );
    });

    const currentMonthTotal = currentMonthTxs.reduce(
      (sum, tx) => sum + tx.amount,
      0
    );
    const lastMonthTotal = lastMonthTxs.reduce((sum, tx) => sum + tx.amount, 0);

    let monthlyGrowth = 0;
    if (lastMonthTotal > 0) {
      monthlyGrowth =
        ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
      monthlyGrowth = 100; // First month with transactions
    }

    setMetrics({
      totalReceived,
      totalTransactions,
      averageTransaction,
      monthlyGrowth,
    });
  };

  // Fetch transactions on wallet address change
  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress, fetchTransactions]);

  console.log("transaction data", transactions);

  return (
    <div className="space-y-8 bg-slate-100 p-4">
      {/* Modern Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-[#3E55E6] bg-clip-text text-transparent">
            Your Dashboard
          </h1>
          <p className="text-lg text-slate-800 text-muted-foreground mt-2">
            Seamlessly manage stablecoin payments and monitor your business
            performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90">
            <Sparkles className="h-4 w-4" />
            Quick Actions
          </Button>
        </div>
      </div>

      {/* Hero Welcome Section */}
      <Card className="relative overflow-hidden border-0 bg-[#3E55E6] text-white shadow-2xl">
        <CardContent className="relative p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Welcome Section */}
            <div className="lg:col-span-2 space-y-4">
              {authenticated ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Welcome Back
                      </h2>
                      <p className="text-white/80">
                        Ready to manage your payments
                      </p>
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
                          {walletAddress?.slice(0, 6)}...
                          {walletAddress?.slice(-4)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white/70 hover:text-white"
                          onClick={() =>
                            navigator.clipboard.writeText(walletAddress || "")
                          }
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
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
                    <h2 className="text-2xl font-bold text-white">
                      Please Connect Wallet
                    </h2>
                    <p className="text-white/80">
                      Connect your wallet to get started
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Balance Card */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/20 text-center">
              <div className="space-y-4">
                <div>
                  <p className="text-white/70 text-sm mb-2">Total Balance</p>
                  <p className="text-3xl font-bold text-white">$4.90</p>
                  <p className="text-white/60 text-xs">USD Equivalent</p>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground text-slate-800">
            Transaction Overview
          </h2>
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            View Analytics
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Received"
            value={metrics.totalReceived.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            subtitle="USDC"
            icon={<ArrowDownRight className="h-5 w-5" />}
            className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
          />
          <MetricCard
            title="Total Transactions"
            value={metrics.totalTransactions.toString()}
            subtitle="Transactions"
            icon={<Activity className="h-5 w-5" />}
            className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20"
          />
          <MetricCard
            title="Average Transaction"
            value={metrics.averageTransaction.toLocaleString("en-US", {
              maximumFractionDigits: 2,
            })}
            subtitle="USDC"
            icon={<DollarSign className="h-5 w-5" />}
            className="border-0 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20"
          />
          <MetricCard
            title="Monthly Growth"
            value={`${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth.toFixed(1)}%`}
            icon={
              metrics.monthlyGrowth >= 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )
            }
            trend={{
              value: `${metrics.monthlyGrowth >= 0 ? "+" : ""}${metrics.monthlyGrowth.toFixed(1)}%`,
              isPositive: metrics.monthlyGrowth >= 0,
            }}
            className={`border-0 bg-gradient-to-br ${
              metrics.monthlyGrowth >= 0
                ? "from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                : "from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
            }`}
          />
        </div>
      </div>

      {/* Analytics & Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily Revenue Chart */}
        <Card className="xl:col-span-2 border-0 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-bold text-slate-800">Daily Revenue</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 text-slate-800">
                Track your daily earnings
              </p>
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

        {/* Payment Methods */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">
                  Payment Methods
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Distribution overview
                </p>
              </div>
              <PieChart className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium">USDC</span>
                </div>
                <span className="font-bold text-blue-600">100%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Other</span>
                </div>
                <span className="text-sm text-muted-foreground">0%</span>
              </div>
            </div>
            <div className="pt-3 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">1</div>
                <div className="text-xs text-muted-foreground">
                  Total Methods
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Recent Transactions
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Your latest payment activities
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              All Currencies
            </Button>
            <Button className="gap-2">
              <ExternalLink className="h-4 w-4" />
              View All Transactions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-muted-foreground pb-3 border-b border-border/50">
              <div>TX HASH</div>
              <div>SENDER</div>
              <div>DATE</div>
              <div>AMOUNT</div>
              <div>STATUS</div>
              <div className="text-right">ACTIONS</div>
            </div>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-6 gap-4 items-center py-4 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="font-mono text-sm text-primary font-medium">
                  {tx.shortId}
                </div>
                <div className="font-mono text-sm">{tx.senderShort}</div>
                <div className="text-sm text-muted-foreground">{tx.date}</div>
                <div className="text-sm font-medium">
                  ${tx.amount} {tx.currency}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tx.status}
                </div>
                <div className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    onClick={() => window.open(tx.blockExplorerUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
                <p className="text-sm text-muted-foreground/70">
                  Your transactions will appear here
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stablecoin Balances */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">
              Stablecoin Balances
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your crypto assets
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button size="sm" className="gap-2">
              <Shield className="h-4 w-4" />
              Secure Wallet
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-muted-foreground pb-3 border-b border-border/50">
              <div className="col-span-5">COIN</div>
              <div className="col-span-3">BALANCE</div>
              <div className="col-span-2">ACTION</div>
              <div className="col-span-2 text-right">MANAGE</div>
            </div>
            {stablecoinBalances.map((coin, index) => (
              <div
                key={coin.symbol}
                className="grid grid-cols-12 gap-4 items-center py-4 hover:bg-muted/30 rounded-xl transition-all duration-200 px-2"
              >
                <div className="col-span-5 flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? "bg-gradient-to-br from-green-500 to-emerald-600" : index === 1 ? "bg-gradient-to-br from-blue-500 to-cyan-600" : index === 2 ? "bg-gradient-to-br from-yellow-500 to-orange-600" : "bg-gradient-to-br from-purple-500 to-pink-600"}`}
                  >
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-bold text-foreground">
                      {coin.symbol}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {coin.name}
                    </div>
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="font-bold text-lg">{coin.balance}</div>
                  <div className="text-xs text-muted-foreground">Available</div>
                </div>
                <div className="col-span-2">
                  <Button variant="outline" size="sm" className="gap-2 w-full">
                    <Send className="h-3 w-3" />
                    {coin.action}
                  </Button>
                </div>
                <div className="col-span-2 flex justify-end gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="mt-6 pt-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  Total Portfolio Value
                </div>
                <div className="text-2xl font-bold text-primary">$4,896.00</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  Active Coins
                </div>
                <div className="text-lg font-semibold">1 of 4</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
