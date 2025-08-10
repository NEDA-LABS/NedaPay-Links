"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Loader } from "lucide-react";

// Helper functions for date manipulation
const parseISO = (dateStr: string) => new Date(dateStr);
const formatDate = (date: Date, formatStr: string) => {
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
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const subDays = (date: Date, days: number) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }) => {
  const dates = [];
  const currentDate = new Date(start);
  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

// Custom tooltip component for dark theme
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
        <p className="text-gray-300 font-medium">{label}</p>
        <p className="text-blue-400">
          {payload[0].name}: <span className="font-bold">{payload[0].value.toLocaleString()}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend component for dark theme
const renderColorfulLegendText = (value: string, entry: any) => {
  const { color } = entry;
  return (
    <span className="text-gray-300" style={{ color }}>
      {value}
    </span>
  );
};

// Revenue Line Chart Component
export function RevenueLineChart({ data }: { data: any }) {
  // Process data for the chart
  const chartData = data.labels.map((date: string, index: number) => ({
    date: formatDate(new Date(date), "MMM dd"),
    amount: data.datasets[0].data[index],
  }));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#1E40AF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={renderColorfulLegendText} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorRevenue)"
            strokeWidth={2}
            activeDot={{ r: 6, fill: "#2563EB" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Transactions Bar Chart Component
export function TransactionsBarChart({ data }: { data: any }) {
  // Group transactions by day
  const groupTransactionsByDay = (transactions: any[]) => {
    const dailyCounts: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const date = formatDate(new Date(tx.date), "yyyy-MM-dd");
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const sortedDates = Object.keys(dailyCounts).sort();
    return sortedDates.map((date) => ({
      date: formatDate(new Date(date), "MMM dd"),
      count: dailyCounts[date],
    }));
  };

  const chartData = groupTransactionsByDay(data.transactions || []);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400">
        No transaction data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF" }}
            tickLine={{ stroke: "#4B5563" }}
            axisLine={{ stroke: "#4B5563" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend formatter={renderColorfulLegendText} />
          <Bar
            dataKey="count"
            name="Transactions"
            fill="#7C3AED"
            radius={[4, 4, 0, 0]}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`rgba(124, 58, 237, ${0.5 + (0.5 * index) / chartData.length})`}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Currency Doughnut Chart Component
export function CurrencyDoughnutChart({ data }: { data: any }) {
  // Transform data for Pie chart
  const chartData = data.labels.map((label: string, index: number) => ({
    name: label,
    value: data.datasets[0].data[index],
    color: data.datasets[0].backgroundColor[index],
  }));

  if (chartData.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-gray-400">
        No currency data available
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            animationDuration={1500}
            label={({ name, percent = 0 }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1F2937",
              borderColor: "#4B5563",
              borderRadius: "0.5rem",
            }}
            itemStyle={{ color: "#E5E7EB" }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              name,
            ]}
          />
          <Legend formatter={renderColorfulLegendText} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}