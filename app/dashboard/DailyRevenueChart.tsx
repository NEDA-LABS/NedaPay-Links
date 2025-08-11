import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Loader } from "lucide-react";

interface Transaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  currency: string;
  status: string;
}

interface DailyRevenueChartProps {
  transactions: Transaction[];
}

// Helper functions for date manipulation
const parseISO = (dateStr: string) => new Date(dateStr);
const format = (date: Date, formatStr: string) => {
  if (formatStr === "yyyy-MM-dd") {
    return date.toISOString().split("T")[0];
  }
  if (formatStr === "MMM dd") {
    return date.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
  }
  if (formatStr === "MMM") {
    return date.toLocaleDateString("en-US", { month: "short" });
  }
  return date.toLocaleDateString();
};
const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const subDays = (date: Date, days: number) =>
  new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const dates = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({
  transactions,
}) => {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("monthly");

  console.log(range, transactions);
  // Decide number of days based on selected range
  const daysMap = {
    daily: 7,
    weekly: 30,
    monthly: 90,
  };
  const days = daysMap[range];

  const completedTransactions = transactions.filter(
    (tx) => tx.status.toLowerCase() === "completed"
  );

  const endDate = startOfDay(new Date());
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const dailyData = dateRange.map((date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayTransactions = completedTransactions.filter((tx) => {
      const txDate = format(parseISO(tx.date), "yyyy-MM-dd");
      return txDate === dateStr;
    });
    const totalAmount = dayTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    return {
      date,
      amount: totalAmount,
      dateLabel:
        range === "daily"
          ? format(date, "MMM dd")
          : range === "weekly"
            ? format(date, "MMM dd")
            : format(date, "MMM"),
    };
  });

  return (
    <div className="w-full bg-slate-800 rounded-xl">
      {/* Header with range selector */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-sm font-medium">Revenue</h2>
        {/* <div className="flex bg-slate-700 rounded-lg p-1">
          <button
            onClick={() => setRange('daily')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              range === 'daily'
                ? 'bg-slate-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setRange('weekly')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              range === 'weekly'
                ? 'bg-slate-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Week
          </button>
        </div> */}
      </div>

      <div className="w-full">
        {completedTransactions.length > 0 ? (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart
              data={dailyData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#1E40AF" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: "#9CA3AF" }}
                tickLine={{ stroke: "#4B5563" }}
                axisLine={{ stroke: "#4B5563" }}
              />
              <YAxis
                tick={{ fill: "#9CA3AF" }}
                tickLine={{ stroke: "#4B5563" }}
                axisLine={{ stroke: "#4B5563" }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#60A5FA"
                strokeWidth={3}
                fill="url(#colorGradient)"
                
                activeDot={{ r: 6, fill: "#2563EB" }}
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400">
            <Loader className="animate-spin mb-2" size={24} />
            <span className="text-sm">Loading data...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyRevenueChart;
