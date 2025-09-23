"use client";
import { useState, useEffect, useMemo } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ethers } from "ethers";
import { stablecoins } from "@/data/stablecoins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Copy, Check } from "lucide-react";
import SwapModal from "@/components/SwapModal";
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
  Copy as CopyIcon,
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
import WalletKit from "./WalletKit";
import { resolveName, toHexAddress } from '../utils/ensUtils';

// import {
//   SidebarProvider,
//   useSidebar,
// } from "@/compliance/user/components/ui/sidebar";
import {
  StablecoinBalanceButton,
  StablecoinBalanceTracker,
} from "@/components/StablecoinBalanceTracker";
import QuickActions from "@/components/QuickActions";
import BroadCastNotificationListener from "@/components/pushNotificationsListener";

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
  const [stablecoinBalances, setStablecoinBalances] = useState<
    StablecoinBalance[]
  >([]);
  const [isBalanceLoading, setIsBalanceLoading] = useState(false);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [swapFromSymbol, setSwapFromSymbol] = useState<string>("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isTransactionLoading, setIsTransactionLoading] = useState(true);
  // const { state, toggleSidebar } = useSidebar();
  // const isCollapsed = state === "collapsed";
  const [metrics, setMetrics] = useState({
    totalReceived: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    monthlyGrowth: 0,
  });
  const [selectedStablecoin, setSelectedStablecoin] = useState<string>("");

  const [copied, setCopied] = useState(false);

  // Set up provider and multicall contract
  const provider = useMemo(
    () => new ethers.providers.JsonRpcProvider(BASE_RPC_URL),
    []
  );
  const multicallContract = useMemo(
    () => new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider),
    [provider]
  );

  // State for ENS name
  const [ensName, setEnsName] = useState<string | null>(null);

  // Resolve ENS name
  useEffect(() => {
    const resolveEnsName = async () => {
      if (!walletAddress) return;
      
      try {
        const name = await resolveName({ address: walletAddress as `0x${string}` });
        console.log("Resolved ENS name:", name); //debugg
        setEnsName(name);
      } catch (error) {
        console.error("Error resolving ENS name:", error); //debugg
        setEnsName(null);
      }
    };

    resolveEnsName();
  }, [walletAddress]);



  // Fetch balances when walletAddress changes
  useEffect(() => {
    if (!walletAddress) return;

    const fetchBalances = async () => {
      setIsBalanceLoading(true);
      try {
        const baseStablecoins = stablecoins.filter((coin) =>
          coin.chainIds.includes(8453)
        );
        const calls = baseStablecoins.flatMap((coin) => [
          {
            target: coin.addresses[8453],
            allowFailure: true,
            callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
              "balanceOf",
              [walletAddress]
            ),
          },
          {
            target: coin.addresses[8453],
            allowFailure: true,
            callData: new ethers.utils.Interface(ERC20_ABI).encodeFunctionData(
              "decimals",
              []
            ),
          },
        ]);

        const results = await multicallContract.aggregate3(calls);
        const realBalances: Record<string, string> = {};
        baseStablecoins.forEach((coin, index) => {
          const balanceResult = results[index * 2];
          const decimalsResult = results[index * 2 + 1];

          if (balanceResult.success && decimalsResult.success) {
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
              realBalances[coin.baseToken] =
                parseFloat(formatted).toLocaleString();
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
        const response = await fetch(
          `/api/transactions?merchantId=${walletAddress}`
        );
        if (!response.ok) throw new Error("Failed to fetch transactions");
        const data = await response.json();

        const formattedTransactions: Transaction[] = data.map((tx: any) => ({
          id: tx.txHash,
          shortId: tx.txHash.slice(0, 6) + "..." + tx.txHash.slice(-4),
          date: new Date(tx.createdAt)
            .toISOString()
            .replace("T", " ")
            .slice(0, 16),
          amount: parseFloat(tx.amount),
          currency: tx.currency,
          status: tx.status,
          sender: tx.wallet,
          senderShort: tx.wallet.slice(0, 6) + "..." + tx.wallet.slice(-4),
          rawDate: new Date(tx.createdAt),
          blockExplorerUrl: `https://basescan.org/tx/${tx.txHash}`,
        }));

        setTransactions(formattedTransactions);

        const uniqueStablecoins = Array.from(
          new Set(formattedTransactions.map((tx) => tx.currency))
        );
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
      (tx) => tx.currency === selectedStablecoin && tx.status === "Completed"
    );
    const totalReceived = filteredTxs.reduce((sum, tx) => sum + tx.amount, 0);
    const totalTransactions = filteredTxs.length;
    const averageTransaction =
      totalTransactions > 0 ? totalReceived / totalTransactions : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTxs = filteredTxs.filter((tx) => {
      const txDate = tx.rawDate;
      return (
        txDate.getMonth() === currentMonth &&
        txDate.getFullYear() === currentYear
      );
    });

    const lastMonthTxs = filteredTxs.filter((tx) => {
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
    <div className="space-y-2 px-2 lg:px-[] max-w-6xl mx-auto">
      <Header />
      <BroadCastNotificationListener />
      <div className="flex items-center justify-between">
        <div>
          {/* <h1 className="text-2xl font-bold text-white">
            Your Dashboard
          </h1> */}
          {/* <p className="text-sm md:text-lg text-white text-muted-foreground mt-2">
            Seamlessly manage stablecoin payments and monitor your business
            performance
          </p> */}
        </div>
      </div>
      {/* Quick Actions - Detached and positioned above */}
      <div className="relative z-40">
      {authenticated && <QuickActions />}
      </div>
      
      <div className=" rounded-2xl relative z-10">
        <Card className="relative border-0 bg-slate-900/90 text-white shadow-2xl md:w-[92%] mx-auto rounded-3xl">
          <CardContent className="relative p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {authenticated ? (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left Column - Address, Balance, Actions */}
                      <div className="space-y-8">
                        {/* Address Section */}
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl"></div>
                          <div className="relative bg-slate-800/30 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                                  <Wallet className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                  <p className="text-xs text-slate-400 mb-1">Wallet Address</p>
                                  <p className="text-white font-mono text-sm font-medium">
                                    {ensName || `${walletAddress?.slice(0, 8)}...${walletAddress?.slice(-6)}`}
                                  </p>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200"
                                onClick={() => {
                                  navigator.clipboard.writeText(walletAddress || "")
                                  setCopied(true)
                                  setTimeout(() => setCopied(false), 2000)
                                }}
                              >
                                {copied ? (
                                  <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Balance Section */}
                        <div>
                          <StablecoinBalanceButton />
                        </div>
                        
                      </div>
                      
                      {/* Right Column - Stablecoins */}
                      <div>
                        <StablecoinBalanceTracker
                          isOpen={true}
                          onClose={() => {}}
                          setTotalBalance={() => {}}
                          setLoading={() => {}}
                        />
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
