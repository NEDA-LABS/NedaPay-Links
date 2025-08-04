// src/components/DailyRevenueChart.tsx
import React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { 
  axisClasses,
} from '@mui/x-charts';
import { Typography } from '@mui/material';
import { format, parseISO, startOfDay, eachDayOfInterval, subDays } from 'date-fns';

interface Transaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  currency: string;
  status: string;
}

interface DailyRevenueChartProps {
  transactions: Transaction[];
  days?: number;
}

const DailyRevenueChart: React.FC<DailyRevenueChartProps> = ({ 
  transactions,
  days = 7
}) => {
    // console.log("transactions in chart", transactions)
  // Filter only completed transactions (case-insensitive)
  const completedTransactions = transactions.filter(
    tx => tx.status.toLowerCase() === 'completed'
  );

  // Create date range for the last X days
  const endDate = startOfDay(new Date());
  const startDate = subDays(endDate, days - 1);
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // Aggregate transactions by day
  const dailyData = dateRange.map(date => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayTransactions = completedTransactions.filter(tx => {
      const txDate = format(parseISO(tx.date), 'yyyy-MM-dd');
      return txDate === dateStr;
    });
    
    const totalAmount = dayTransactions.reduce(
      (sum, tx) => sum + tx.amount, 0
    );
    
    return {
      date: date,
      amount: totalAmount,
      dateLabel: format(date, 'MMM dd'),
    };
  });

  // Chart data
  const xAxisData = dailyData.map(item => item.dateLabel);
  const yAxisData = dailyData.map(item => item.amount);
  const colors = ['#3E55E6'];

  return (
    <div className="w-full h-[320px]">
      {completedTransactions.length > 0 ? (
        <LineChart
          series={[
            { 
              data: yAxisData, 
              label: 'Daily Revenue',
              color: colors[0],
              showMark: true,
              curve: 'linear',
            }
          ]}
          xAxis={[{ 
            scaleType: 'point', 
            data: xAxisData,
            tickLabelStyle: { fontSize: 12 },
          }]}
          yAxis={[{
            tickLabelStyle: { fontSize: 12 },
          }]}
          sx={{
            [`.${axisClasses.left} .${axisClasses.label}`]: {
              fontSize: 14,
              transform: 'rotate(0)',
            },
            [`.${axisClasses.bottom} .${axisClasses.label}`]: {
              fontSize: 14,
            },
          }}
          grid={{ vertical: true, horizontal: true }}
        />
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
          <Typography variant="body1" className="mb-2 text-slate-800">
            No revenue data available
          </Typography>
          <Typography variant="body2" className="text-slate-800">
            Your daily revenue will appear here
          </Typography>
        </div>
      )}
    </div>
  );
};

export default DailyRevenueChart;