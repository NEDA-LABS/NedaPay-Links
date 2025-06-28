import { useEffect, useState, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { stablecoins } from "../data/stablecoins";

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

interface ChartComponentProps {
  transactions: Transaction[];
}

interface PieDataPoint {
  name: string;
  value: number;
  flag: string;
  currency: string;
  color: string;
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

// Custom tooltip component
const CustomTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PieDataPoint;
    const percentage = ((data.value / payload[0].payload.totalTransactions) * 100).toFixed(1);
    
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-gray-900 font-medium">
          {`${data.flag} ${data.currency}`}
        </p>
        <p className="text-sm text-gray-600">
          {`Transactions: ${data.value.toLocaleString()}`}
        </p>
        <p className="text-sm text-gray-600">
          {`Percentage: ${percentage}%`}
        </p>
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend: React.FC<any> = ({ payload }) => {
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-4">
      {payload?.map((entry: any, index: number) => (
        <div 
          key={index} 
          className="flex items-center gap-2 text-sm"
        >
          <div 
            className="w-3 h-3 rounded"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-700">
            {`${entry.payload.flag} ${entry.payload.currency}`}
          </span>
        </div>
      ))}
    </div>
  );
};

// Custom label function for the pie slices
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
  
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={12}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const PieChartComponent: React.FC<ChartComponentProps> = ({ transactions }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsDarkMode(theme === 'dark');
  }, [theme]);

  // Process data for pie chart
  const pieData = useMemo(() => {
    const grouped: Record<string, { count: number; flag: string }> = {};
    
    transactions.forEach((tx) => {
      const symbol = tx.currency;
      if (!grouped[symbol]) {
        const coin = stablecoins.find((c) => c.baseToken === symbol);
        grouped[symbol] = { count: 0, flag: coin?.flag || "🌐" };
      }
      grouped[symbol].count++;
    });

    const entries = Object.entries(grouped).filter(
      ([_, data]) => data.count > 0
    );

    // Sort symbols to match stablecoin order for consistent color assignment
    const stablecoinOrder = stablecoins.map((c) => c.baseToken);
    const sortedEntries = entries.sort(
      ([a], [b]) => stablecoinOrder.indexOf(a) - stablecoinOrder.indexOf(b)
    );

    const totalTransactions = sortedEntries.reduce((sum, [_, data]) => sum + data.count, 0);

    const data: PieDataPoint[] = sortedEntries.map(([symbol, data]) => ({
      name: `${data.flag} ${symbol}`,
      value: data.count,
      flag: data.flag,
      currency: symbol,
      color: colorMap[symbol] || '#8884d8',
      totalTransactions // Add total for percentage calculation
    }));

    return data;
  }, [transactions]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={80}
            innerRadius={30} // Creates a doughnut effect
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {pieData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                stroke={entry.color}
                strokeWidth={1}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            content={<CustomLegend />}
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;