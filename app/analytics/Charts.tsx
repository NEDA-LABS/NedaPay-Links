// Charts.tsx
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { useTheme } from "next-themes";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Define theme-based colors
const getThemeColors = (isDarkMode: boolean) => ({
  textColor: isDarkMode ? "#e5e7eb" : "#111827",
  gridColor: isDarkMode ? "#374151" : "#e5e7eb",
  tooltipBg: isDarkMode ? "#1f2937" : "#ffffff",
  tooltipBorder: isDarkMode ? "#4b5563" : "#d1d5db",
});

// Function to group transactions by day for Bar chart
const groupTransactionsByDay = (transactions: any[]) => {
  console.log("groupTransactionsByDay input transactions:", transactions); // Debug

  const dailyCounts: Record<string, number> = {};

  transactions.forEach((tx, index) => {
    if (!tx.date || typeof tx.date !== "string") {
      console.warn(`Invalid date at index ${index}:`, tx.date); // Debug
      return;
    }

    // Try to parse date flexibly
    let date: string;
    try {
      const parsedDate = new Date(tx.date);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date");
      }
      // Format as YYYY-MM-DD
      date = parsedDate.toISOString().split("T")[0];
    } catch (error) {
      console.warn(`Failed to parse date at index ${index}:`, tx.date, error); // Debug
      return;
    }

    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  // Sort dates and prepare labels and data
  const sortedDates = Object.keys(dailyCounts).sort();
  const data = sortedDates.map((date) => dailyCounts[date]);

  console.log("groupTransactionsByDay output:", { labels: sortedDates, data }); // Debug

  return {
    labels: sortedDates,
    data,
  };
};

// Chart components
interface ChartProps {
  data: any;
}

export function RevenueLineChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? theme === "dark" : false;
  console.log("RevenueLineChart isDarkMode:", isDarkMode, "Mounted:", mounted); // Debug

  const themeColors = getThemeColors(isDarkMode);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: themeColors.textColor,
          font: { size: 14, weight: "bold" as const },
        },
      },
      tooltip: {
        titleColor: themeColors.textColor,
        bodyColor: themeColors.textColor,
        footerColor: themeColors.textColor,
        backgroundColor: themeColors.tooltipBg,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: themeColors.textColor,
          font: { size: 13, weight: "bold" as const },
        },
        grid: {
          color: themeColors.gridColor,
        },
      },
      y: {
        ticks: {
          color: themeColors.textColor,
          font: { size: 13, weight: "bold" as const },
        },
        grid: {
          color: themeColors.gridColor,
        },
      },
    },
  };

  if (!mounted) return null;
  return <Line key={`line-${isDarkMode}`} data={data} options={chartOptions} />;
}

export function TransactionsBarChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? theme === "dark" : false;
  console.log("TransactionsBarChart isDarkMode:", isDarkMode, "Mounted:", mounted); // Debug

  const themeColors = getThemeColors(isDarkMode);

  const { labels, data: aggregatedData } = groupTransactionsByDay(data.transactions || []);

  const barData = {
    labels,
    datasets: [
      {
        label: "Transactions",
        data: aggregatedData,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  console.log("TransactionsBarChart barData:", barData); // Debug

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: themeColors.textColor,
          font: { size: 14, weight: "bold" as const },
        },
      },
      tooltip: {
        titleColor: themeColors.textColor,
        bodyColor: themeColors.textColor,
        footerColor: themeColors.textColor,
        backgroundColor: themeColors.tooltipBg,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: themeColors.textColor,
          font: { size: 13, weight: "bold" as const },
        },
        grid: {
          color: themeColors.gridColor,
        },
      },
      y: {
        ticks: {
          color: themeColors.textColor,
          font: { size: 13, weight: "bold" as const },
        },
        grid: {
          color: themeColors.gridColor,
        },
        beginAtZero: true, // Ensure y-axis starts at 0
      },
    },
  };

  if (!mounted) return null;
  // Return empty state if no data
  if (!labels.length || !aggregatedData.length) {
    return <div className="text-center text-gray-500">No transaction data available</div>;
  }

  return <Bar key={`bar-${isDarkMode}`} data={barData} options={chartOptions} />;
}

export function CurrencyDoughnutChart({ data }: ChartProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? theme === "dark" : false;
  console.log("CurrencyDoughnutChart isDarkMode:", isDarkMode, "Mounted:", mounted); // Debug

  const themeColors = getThemeColors(isDarkMode);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: themeColors.textColor,
          font: { size: 14, weight: "bold" as const },
        },
      },
      tooltip: {
        titleColor: themeColors.textColor,
        bodyColor: themeColors.textColor,
        footerColor: themeColors.textColor,
        backgroundColor: themeColors.tooltipBg,
        borderColor: themeColors.tooltipBorder,
        borderWidth: 1,
      },
    },
  };

  if (!mounted) return null;
  return <Doughnut key={`doughnut-${isDarkMode}`} data={data} options={doughnutOptions} />;
}