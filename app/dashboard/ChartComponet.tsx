import { useState, useEffect } from 'react';
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
} from 'chart.js';
import { stablecoins } from '../data/stablecoins';
import { useTheme } from 'next-themes';

// Register Chart.js components
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

// Define the shape of the transaction
interface Transaction {
  id: string;
  shortId: string;
  date: string; // Expected format: "YYYY-MM-DD HH:MM:SS" or similar
  amount: string;
  currency: string;
  status: string;
  sender: string;
  senderShort: string;
  blockExplorerUrl: string;
}

// Define props for the component
interface ChartComponentProps {
  transactions: Transaction[];
}

// Define color mapping based on the image attachment
const colorMap: { [key: string]: string } = {
  TSHC: '#00A1D6', // Blue
  cNGN: '#00A65A', // Green
  NGNC: '#F5A623', // Orange
  ZARP: '#A100A1', // Purple
  IDRX: '#D6323A', // Red
  EURC: '#00A1D6', // Blue
  CADC: '#00A65A', // Green
  BRL: '#F5A623', // Orange
  TRYB: '#A100A1', // Purple
  NZDD: '#D6323A', // Red
  MXNe: '#00A1D6', // Blue
  USDC: '#00A65A', // Green
};

// Function to format date as YY-MM-DD HH:MM
const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (e) {
    console.warn(`Invalid date format: ${dateStr}`);
    return dateStr;
  }
};

// Function to get chart data with validation
const getMultiStablecoinHourlyRevenueData = (
  transactions: Transaction[]
): ChartData<'line', number[], string> => {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    console.warn('Invalid or empty transactions data');
    return { labels: [], datasets: [] };
  }

  // Get unique date-hour-minute combinations
  const dateTimeSet = new Set<string>();
  transactions.forEach((tx) => {
    if (tx.date && typeof tx.date === 'string') {
      // Slice to YYYY-MM-DD HH:MM (first 16 characters, assuming format like "YYYY-MM-DD HH:MM:SS")
      const dateTime = tx.date.slice(0, 16);
      dateTimeSet.add(dateTime);
    }
  });
  const labels = Array.from(dateTimeSet).sort();

  // Get unique stablecoin symbols
  const stablecoinSymbols = Array.from(new Set(transactions.map((tx) => tx.currency)));

  // Generate datasets for each stablecoin
  const datasets = stablecoinSymbols.map((symbol) => {
    const coin = stablecoins.find((c) => c.baseToken === symbol);
    const flag = coin?.flag || '🌐';
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

    return {
      label: `${flag} ${symbol}`,
      data,
      fill: false,
      tension: 0.2,
      borderColor: colorMap[symbol] as Color,
      backgroundColor: `${colorMap[symbol]}80` as Color, // 50% opacity
    };
  });

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

  return { labels, datasets };
};

const ChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(theme === 'dark');

  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  const maxAmount = transactions
    .map((tx) => parseFloat(tx.amount.replace(/,/g, '')) || 0)
    .filter((num) => !isNaN(num))
    .reduce((max, num) => Math.max(max, num), 0);
  const suggestedMax = maxAmount > 0 ? maxAmount * 1.2 : 100;

  const textColor = isDarkMode ? '#ffffff' : '#222222';

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax,
        grid: { color: isDarkMode ? 'rgba(159, 161, 160, 0.28)' : 'rgba(100, 102, 101, 0.17)' },
        ticks: { color: isDarkMode ? '#fffff0' : '#4b5563' },
      },
      x: {
        grid: { display: false },
        ticks: {
          color: isDarkMode ? '#fffff0' : '#4b5563',
          callback: function (value) {
            const label = this.getLabelForValue(value as number);
            return formatDate(label);
          },
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
          usePointStyle: false,
          boxWidth: 20,
          boxHeight: 9,
          padding: 10,
          generateLabels: (chart): LegendItem[] => {
            const { datasets } = chart.data;
            if (!datasets || !datasets.length) return [];
            return datasets.map((ds, i) => {
              const labelString = ds.label || '';
              const match = labelString.match(/^(\S+)\s+(.+)$/);
              let flag = '', code = '';
              if (match) {
                flag = match[1];
                code = match[2];
              } else {
                code = labelString;
              }
              return {
                text: `${flag} ${code}`.trim(),
                fillStyle: ds.borderColor as Color,
                strokeStyle: ds.borderColor as Color,
                hidden: !chart.isDatasetVisible(i),
                index: i,
                lineWidth: 2,
              };
            });
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const ds = context.dataset;
            const label = ds.label || '';
            const match = label.match(/^(\S+)\s+(.+)$/);
            let flag = '', code = '';
            if (match) {
              flag = match[1];
              code = match[2];
            } else {
              code = label;
            }
            return `${flag} ${code}: ${context.parsed.y.toLocaleString()}`;
          },
          title: function (context) {
            const label = context[0].label;
            return formatDate(label);
          },
        },
      },
    },
  };

  return (
    <div className="h-64 w-full" style={{ position: 'relative', maxHeight: '256px' }}>
      <Line data={getMultiStablecoinHourlyRevenueData(transactions)} options={options} />
    </div>
  );
};

export default ChartComponent;
