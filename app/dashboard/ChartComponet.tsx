import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { stablecoins } from '../data/stablecoins';
import { useTheme } from 'next-themes';

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

// Chart data point interface
interface ChartDataPoint {
  dateTime: string;
  formattedDateTime: string;
  [key: string]: string | number; // Dynamic keys for each stablecoin
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
  USDC: '#F5A623', // Green
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

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ 
  active, 
  payload, 
  label 
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-gray-900 font-medium mb-2">
          {formatDate(label as string)}
        </p>
        {payload.map((entry: any, index: number) => {
          const currency = entry.dataKey as string;
          const coin = stablecoins.find((c) => c.baseToken === currency);
          const flag = coin?.flag || '🌐';
          
          return (
            <p 
              key={index} 
              className="text-sm"
              style={{ color: entry.color }}
            >
              {`${flag} ${currency}: ${entry.value?.toLocaleString()}`}
            </p>
          );
        })}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend: React.FC<any> = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload?.map((entry: any, index: number) => {
        const currency = entry.dataKey;
        const coin = stablecoins.find((c) => c.baseToken === currency);
        const flag = coin?.flag || '🌐';
        
        return (
          <div 
            key={index} 
            className="flex items-center gap-2 text-sm"
          >
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-700">
              {`${flag} ${currency}`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const ChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(theme === 'dark');

  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Process data for Recharts format
  const chartData = useMemo(() => {
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      console.warn('Invalid or empty transactions data');
      return [];
    }

    // Get unique date-time combinations
    const dateTimeSet = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && typeof tx.date === 'string') {
        const dateTime = tx.date.slice(0, 16);
        dateTimeSet.add(dateTime);
      }
    });
    const sortedDateTimes = Array.from(dateTimeSet).sort();

    // Get unique stablecoin symbols
    const stablecoinSymbols = Array.from(new Set(transactions.map((tx) => tx.currency)));

    // Create data points
    const data: ChartDataPoint[] = sortedDateTimes.map((dateTime) => {
      const dataPoint: ChartDataPoint = {
        dateTime,
        formattedDateTime: formatDate(dateTime),
      };

      // Add data for each stablecoin
      stablecoinSymbols.forEach((symbol) => {
        const timeSum = transactions
          .filter((tx) => {
            const txDateTime = tx.date.slice(0, 16);
            return tx.currency === symbol && txDateTime === dateTime;
          })
          .reduce((sum, tx) => {
            const amount = parseFloat(tx.amount.replace(/,/g, '')) || 0;
            return sum + (isNaN(amount) ? 0 : amount);
          }, 0);
        
        dataPoint[symbol] = timeSum;
      });

      return dataPoint;
    });

    return data;
  }, [transactions]);

  // Get unique stablecoin symbols for rendering lines
  const stablecoinSymbols = useMemo(() => {
    return Array.from(new Set(transactions.map((tx) => tx.currency)));
  }, [transactions]);

  const gridColor = isDarkMode ? 'rgba(159, 161, 160, 0.28)' : 'rgba(100, 102, 101, 0.17)';
  const textColor = isDarkMode ? '#ffffff' : '#222222';
  const axisColor = isDarkMode ? '#fffff0' : '#4b5563';

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={gridColor}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="dateTime"
            tick={{ fill: axisColor, fontSize: 12 }}
            tickFormatter={formatDate}
            stroke={axisColor}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 12 }}
            stroke={axisColor}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          
          {stablecoinSymbols.map((symbol) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={symbol}
              stroke={colorMap[symbol] || '#8884d8'}
              strokeWidth={2.5}
              dot={{ fill: colorMap[symbol], strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: colorMap[symbol], strokeWidth: 2 }}
              connectNulls={false}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ChartComponent;