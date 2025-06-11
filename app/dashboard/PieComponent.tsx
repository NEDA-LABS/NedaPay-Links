
import { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Color,
  Chart as ChartType,
} from 'chart.js';
import { stablecoins } from '../data/stablecoins';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Define types
interface Transaction {
  id: string;
  shortId: string;
  date: string;
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

const getPaymentMethodsData = (transactions: Transaction[]): ChartData<'doughnut', number[], string> => {
  if (!transactions?.length || !Array.isArray(transactions)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Invalid or empty transactions data');
    }
    return { labels: [], datasets: [] };
  }

  const grouped: Record<string, { count: number; flag: string }> = {};
  transactions.forEach((tx) => {
    const symbol = tx.currency;
    if (!grouped[symbol]) {
      const coin = stablecoins.find((c: Stablecoin) => c.baseToken === symbol);
      grouped[symbol] = { count: 0, flag: coin?.flag || '🏳️' };
    }
    grouped[symbol].count++;
  });
  const entries = Object.entries(grouped).filter(([_, data]) => data.count > 0);

  // Sort symbols to match stablecoin order
  const stablecoinOrder = stablecoins.map((c: Stablecoin) => c.baseToken);
  const labels = entries
    .sort(([a], [b]) => stablecoinOrder.indexOf(a) - stablecoinOrder.indexOf(b))
    .map(([symbol]) => {
      const coin = stablecoins.find((c: Stablecoin) => c.baseToken === symbol);
      return `${coin?.flag || '🏳️'} ${symbol}`;
    });

  const data = entries
    .sort(([a], [b]) => stablecoinOrder.indexOf(a) - stablecoinOrder.indexOf(b))
    .map(([_, d]) => d.count);

  const backgroundColor: Color[] = labels.map((label) => {
    const symbol = label.split(' ').pop() || '';
    return `${colorMap[symbol]}CC`; // 80% opacity
  });
  const borderColor: Color[] = labels.map((label) => {
    const symbol = label.split(' ').pop() || '';
    return colorMap[symbol];
  });

  return {
    labels,
    datasets: [
      {
        label: 'Payment Methods',
        data,
        backgroundColor,
        borderColor,
        borderWidth: 1,
        hoverOffset: 20,
      },
    ],
  };
};

const PieChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  const chartRef = useRef<ChartType<'doughnut', number[], string> | null>(null);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#1e293b', // text-slate-800
          padding: 20,
          font: { size: 10, weight: 600 },
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          generateLabels: (chart) => {
            const { datasets, labels } = chart.data;
            if (!datasets?.length || !labels?.length) return [];
            const backgroundColor = datasets[0].backgroundColor as Color[];
            const borderColor = datasets[0].borderColor as Color[];
            return labels.map((label, i) => ({
              text: label as string,
              fillStyle: backgroundColor[i] as Color,
              strokeStyle: borderColor[i] as Color,
              lineWidth: 1,
              hidden: false,
              index: i,
              pointStyle: 'circle',
            }));
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
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed as number;
            return `${label}: ${value.toLocaleString()} transactions`;
          },
        },
      },
    },
  };

  return (
    <div className="relative h-full w-full bg-white/95 backdrop-blur-sm rounded-lg p-2 animate-slide-in">
      <Doughnut
        ref={chartRef}
        data={getPaymentMethodsData(transactions)}
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

export default PieChartComponent;
