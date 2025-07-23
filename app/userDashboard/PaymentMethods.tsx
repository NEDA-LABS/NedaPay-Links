// src/components/PaymentMethods.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/Card";
import { Button } from "@/components/Button";
import { PieChart } from "lucide-react";
import { Badge } from "@/components/Badge";
import { stablecoins } from "@/data/stablecoins";

interface PaymentMethod {
  currency: string;
  baseToken: string;
  amount: number;
  percentage: number;
  count: number;
  flag: string;
  region: string;
  color: string;
}

interface PaymentMethodsProps {
  transactions: {
    currency: string;
    amount: number;
    status: string;
  }[];
}

const tokenColors: Record<string, string> = {
  USDC: 'bg-blue-500',
  USDT: 'bg-emerald-500',
  DAI: 'bg-yellow-500',
  BUSD: 'bg-amber-500',
  cNGN: 'bg-green-500',
  NGNC: 'bg-teal-500',
  ZARP: 'bg-red-500',
  IDRX: 'bg-indigo-500',
  EURC: 'bg-blue-600',
  CADC: 'bg-red-600',
  BRL: 'bg-green-600',
  TRYB: 'bg-yellow-600',
  NZDD: 'bg-purple-500',
  MXNe: 'bg-pink-500',
  DEFAULT: 'bg-primary'
};

const tokenTextColors: Record<string, string> = {
  USDC: 'text-blue-600',
  USDT: 'text-emerald-600',
  DAI: 'text-yellow-600',
  BUSD: 'text-amber-600',
  cNGN: 'text-green-600',
  NGNC: 'text-teal-600',
  ZARP: 'text-red-600',
  IDRX: 'text-indigo-600',
  EURC: 'text-blue-700',
  CADC: 'text-red-700',
  BRL: 'text-green-700',
  TRYB: 'text-yellow-700',
  NZDD: 'text-purple-600',
  MXNe: 'text-pink-600',
  DEFAULT: 'text-primary'
};

export const PaymentMethods = ({ transactions }: PaymentMethodsProps) => {
  // Process transactions to get payment methods breakdown
  const processPaymentMethods = () => {
    const tokenMap = new Map<string, { amount: number, count: number }>();

    // Filter only completed transactions
    const completedTransactions = transactions.filter(tx => tx.status === 'Completed');

    // Aggregate by token (using baseToken from stablecoins)
    completedTransactions.forEach(tx => {
      const stablecoin = stablecoins.find(sc => 
        sc.addresses[8453]?.toLowerCase() === tx.currency.toLowerCase() || 
        sc.baseToken === tx.currency
      );
      
      const token = stablecoin?.baseToken || tx.currency;
      const current = tokenMap.get(token) || { amount: 0, count: 0 };
      tokenMap.set(token, {
        amount: current.amount + tx.amount,
        count: current.count + 1
      });
    });

    // Calculate total for percentages
    const totalAmount = Array.from(tokenMap.values()).reduce((sum, curr) => sum + curr.amount, 0);
    const totalCount = Array.from(tokenMap.values()).reduce((sum, curr) => sum + curr.count, 0);

    // Convert to array with stablecoin metadata and calculate percentages
    const methods: PaymentMethod[] = Array.from(tokenMap.entries()).map(([token, data]) => {
      const stablecoin = stablecoins.find(sc => sc.baseToken === token);
      
      return {
        currency: stablecoin?.currency || token,
        baseToken: token,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        count: data.count,
        flag: stablecoin?.flag || '🌐',
        region: stablecoin?.region || 'Global',
        color: tokenColors[token] || tokenColors.DEFAULT
      };
    });

    // Sort by amount descending
    return methods.sort((a, b) => b.amount - a.amount);
  };

  const paymentMethods = processPaymentMethods();
  const totalMethods = paymentMethods.length;
  const hasUSDC = paymentMethods.some(method => method.baseToken === 'USDC');

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Payment Methods</CardTitle>
            <p className="text-xs text-muted-foreground mt-1 text-slate-800">Distribution overview</p>
          </div>
          <PieChart className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
              <div 
                key={method.baseToken} 
                className={`flex items-center justify-between p-3 rounded-lg ${
                  method.baseToken === 'USDC' 
                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
                    : 'bg-gray-50 dark:bg-gray-900/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{method.flag}</span>
                    <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                  </div>
                  <div>
                    <span className={`text-sm text-slate-800 ${
                      method.baseToken === 'USDC' 
                        ? 'font-medium' 
                        : 'text-muted-foreground'
                    }`}>
                      {method.baseToken}
                    </span>
                    {/* <span className="block text-xs text-muted-foreground">
                      {method.region}
                    </span> */}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-bold text-slate-800 ${
                    method.baseToken === 'USDC' 
                      ? tokenTextColors[method.baseToken] || tokenTextColors.DEFAULT
                      : 'text-sm text-muted-foreground'
                  }`}>
                    {method.percentage.toFixed(0)}%
                  </span>
                  <span className="block text-xs text-muted-foreground text-slate-800">
                    {method.count} {method.count === 1 ? 'tx' : 'txs'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/20 text-center">
              <p className="text-muted-foreground text-slate-800">No payment data available</p>
            </div>
          )}
        </div>
        
        <div className="pt-3 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-800">{totalMethods}</div>
            <div className="text-xs text-muted-foreground text-slate-800">
              {hasUSDC ? 'Including USDC' : 'Total Methods'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};