import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  LegendItem,
  Color,
  Chart as ChartType,
} from 'chart.js';
import { stablecoins } from '../data/stablecoins';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Define types
interface Transaction {
  id: string;
  shortId: string;
  date: string; // e.g., "YYYY-MM-DD HH:MM:SS"
  amount: string;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  blockExplorerUrl: string;
}

interface Stablecoin {
  baseToken: string;
  flag: string;
}

interface ChartComponentProps {
  transactions: Transaction[];
}

// Tailwind-aligned color map (unique colors)
const colorMap: { [key: string]: string } = {
  TSHC: '#2563eb', // blue-600
  cNGN: '#16a34a', // green-600
  NGNC: '#f59e0b', // amber-500
  ZARP: '#7c3aed', // purple-600
  IDRX: '#dc2626', // red-600
  EURC: '#3b82f6', // blue-500
  CADC: '#22c55e', // green-500
  BRL: '#d97706', // amber-600
  TRYB: '#9333ea', // purple-500
  NZDD: '#ef4444', // red-500
  MXNe: '#1d4ed8', // blue-700
  USDC: '#15803d', // green-700
};

// Format date to YY-MM-DD HH:MM
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error('Invalid date');
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Invalid date format: ${dateStr}`);
    }
    return dateStr.slice(0, 16) || 'Invalid';
  }
};

// Get chart data with gradient fills
const getMultiStablecoinHourlyRevenueData = (
  transactions: Transaction[],
  chartInstance: ChartType<'line', number[], string> | null
): ChartData<'line', number[], string> => {
  if (!transactions?.length || !Array.isArray(transactions)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Invalid or empty transactions data');
    }
    return { labels: [], datasets: [] };
  }

  // Unique date-hour-minute labels
  const dateTimeSet = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.date && typeof tx.date === 'string' && tx.date.length >= 16) {
      const dateTime = tx.date.slice(0, 16);
      dateTimeSet.add(dateTime);
    }
  });
  const labels = Array.from(dateTimeSet).sort();

  // Unique stablecoin symbols
  const stablecoinSymbols = Array.from(new Set(transactions.map((tx) => tx.currency)));

  // Generate datasets
  const datasets = stablecoinSymbols.map((symbol) => {
    const coin = stablecoins.find((c: Stablecoin) => c.baseToken === symbol);
    const flag = coin?.flag || '🏳️';
    const data = labels.map((dateTime) => {
      const timeSum = transactions
        .filter((tx) => {
          const txDateTime = tx.date.slice(0, 16);
          return tx.currency === symbol && txDateTime === dateTime;
        })
        .reduce((sum, tx) => {
          const amount = parseFloat(tx.amount.replace(/,/g, '')) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      return timeSum;
    });

    // Create gradient fill
    let gradientFill: string | CanvasGradient = colorMap[symbol] + '80';
    if (chartInstance?.canvas) {
      const ctx = chartInstance.canvas.getContext('2d');
      if (ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, chartInstance.canvas.height);
        gradient.addColorStop(0, colorMap[symbol] + '33'); // 20% opacity
        gradient.addColorStop(1, colorMap[symbol] + '00'); // 0% opacity
        gradientFill = gradient;
      }
    }

    return {
      label: `${flag} ${symbol}`,
      data,
      fill: true,
      tension: 0.3,
      borderColor: colorMap[symbol],
      backgroundColor: gradientFill,
      pointBackgroundColor: colorMap[symbol],
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
    };
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log('Chart Data:', { labels, datasets });
    datasets.forEach((dataset) => {
      if (dataset.data.length !== labels.length) {
        console.error(`Dataset length mismatch for ${dataset.label}:`, {
          dataLength: dataset.data.length,
          labelsLength: labels.length,
        });
      }
      dataset.data.forEach((value, i) => {
        if (isNaN(value) || value < 0) {
          console.warn(`Invalid data point at index ${i} for ${dataset.label}: ${value}`);
        }
      });
    });
  }

  return { labels, datasets };
};

const ChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  const chartRef = useRef<ChartType<'line', number[], string> | null>(null);

  const maxAmount = transactions
    .map((tx) => parseFloat(tx.amount.replace(/,/g, '')) || 0)
    .filter((num) => !isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);
  const suggestedMax = maxAmount > 0 ? maxAmount * 1.2 : 100;

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax,
        grid: { color: 'rgba(203, 213, 225, 0.2)' }, // slate-300/20
        ticks: { color: '#475569', font: { size: 12 } }, // text-slate-600
      },
      x: {
        grid: { display: false },
        ticks: {
          color: '#475569', // text-slate-600
          font: { size: 10 },
          callback: function (value) {
            const label = this.getLabelForValue(value as number);
            return formatDate(label);
          },
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#1e293b', // text-slate-800
          font: { size: 10, weight: 600 },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          padding: 10,
          generateLabels: (chart): LegendItem[] => {
            const { datasets } = chart.data;
            if (!datasets?.length) return [];
            return datasets.map((ds, i) => {
              const labelString = ds.label || '';
              const match = labelString.match(/^(\S+)\s+(.+)$/);
              const flag = match ? match[1] : '';
              const code = match ? match[2] : labelString;
              return {
                text: `${flag} ${code}`.trim(),
                fillStyle: ds.borderColor as Color, // Use borderColor for solid color
                strokeStyle: ds.borderColor as Color,
                hidden: !chart.isDatasetVisible(i),
                index: i,
                lineWidth: 1,
                pointStyle: 'circle',
              };
            });
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b', // text-slate-800
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0', // slate-200
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: function (context) {
            const ds = context.dataset;
            const label = ds.label || '';
            const match = label.match(/^(\S+)\s+(.+)$/);
            const flag = match ? match[1] : '';
            const code = match ? match[2] : label;
            return `${flag} ${code}: ${context.parsed.y.toLocaleString()}`;
          },
          title: function (context) {
            const label = context[0].label;
            return formatDate(label);
          },
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  return (
    <div className="relative h-full w-full bg-white/95 backdrop-blur-sm rounded-lg p-2 animate-slide-in">
      <Line
        ref={chartRef}
        data={getMultiStablecoinHourlyRevenueData(transactions, chartRef.current)}
        options={options}
      />
      <style jsx global>{`
        .animate-slide-in {
          opacity: 0;
          transform: translateY(10px);
          animation: slideIn 0.6s ease-out forwards;
        }

        @keyframes slideIn {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-pulse-slow {
          animation: pulseSlow 6s ease-in-out infinite;
        }

        @keyframes pulseSlow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </div>
  );
};

export default ChartComponent;