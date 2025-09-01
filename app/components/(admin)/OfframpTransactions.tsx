'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { 
  Filter, 
  Search, 
  Download, 
  RefreshCw, 
  Calendar, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface PaymentOrder {
  id: string;
  amount: string;
  amountPaid: string;
  amountReturned: string;
  token: string;
  senderFee: string;
  transactionFee: string;
  rate: string;
  network: string;
  gatewayId: string;
  reference: string;
  recipient: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    memo: string;
    providerId?: string;
  };
  fromAddress: string;
  returnAddress: string;
  receiveAddress: string;
  feeAddress: string;
  createdAt: string;
  updatedAt: string;
  txHash: string;
  status: 'pending' | 'settled' | 'expired';
}

interface Summary {
  totalTransactions: number;
  totalAmount: number;
  totalAmountPaid: number;
  totalFees: number;
  byStatus: Record<string, number>;
  byToken: Record<string, { count: number; totalAmount: number; totalPaid: number }>;
  byNetwork: Record<string, number>;
  recentActivity: Record<string, number>;
}

const COLORS = {
  pending: '#f59e0b',
  settled: '#10b981',
  expired: '#ef4444',
  primary: '#6366f1',
  secondary: '#8b5cf6',
  accent: '#06b6d4'
};

export default function OfframpTransactions() {
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    token: '',
    network: '',
    search: '',
    startDate: '',
    endDate: '',
    timePeriod: '', // New time period filter
    page: 1,
    pageSize: 20
  });

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });

      const response = await fetch(`/api/admin/paycrest-orders?${queryParams}`, {
        headers: {
          'x-admin-access-key': process.env.NEXT_PUBLIC_APP_ACCESS!
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.data.orders);
      setSummary(data.data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  const statusChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: COLORS[status as keyof typeof COLORS] || COLORS.primary
    }));
  }, [summary]);

  const tokenChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.byToken).map(([token, data]) => ({
      name: token.toUpperCase(),
      count: data.count,
      amount: data.totalAmount,
      paid: data.totalPaid
    }));
  }, [summary]);

  const activityChartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.recentActivity).map(([date, count]) => ({
      date,
      transactions: count
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [summary]);

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [key]: value,
        ...(key !== 'page' && { page: 1 }) // Reset to first page when filtering
      };

      // Handle time period changes
      if (key === 'timePeriod') {
        const now = new Date();
        let startDate = '';
        let endDate = '';

        switch (value) {
          case 'today':
            startDate = now.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = yesterday.toISOString().split('T')[0];
            endDate = yesterday.toISOString().split('T')[0];
            break;
          case 'last7days':
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            startDate = sevenDaysAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'last30days':
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            startDate = thirtyDaysAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'last3months':
            const threeMonthsAgo = new Date(now);
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            startDate = threeMonthsAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'last6months':
            const sixMonthsAgo = new Date(now);
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            startDate = sixMonthsAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'lastyear':
            const oneYearAgo = new Date(now);
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            startDate = oneYearAgo.toISOString().split('T')[0];
            endDate = now.toISOString().split('T')[0];
            break;
          case 'custom':
          case '':
          default:
            // Don't auto-set dates for custom or all time
            break;
        }

        if (value !== 'custom' && value !== '') {
          newFilters.startDate = startDate;
          newFilters.endDate = endDate;
        } else if (value === '') {
          // Clear dates when "All Time" is selected
          newFilters.startDate = '';
          newFilters.endDate = '';
        }
      }

      return newFilters;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'settled': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'expired': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-800 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-slate-800 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-80 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-400 mb-2">Error Loading Data</h2>
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={fetchOrders}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Offramp Transactions Dashboard</h1>
            <p className="text-slate-400">Monitor and analyze your payment orders</p>
          </div>
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Transactions</p>
                  <p className="text-2xl font-bold text-white">{summary.totalTransactions.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-indigo-400" />
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Amount Paid</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalAmountPaid)}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Fees</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalFees)}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Distribution */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Token Distribution */}
          <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Token Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tokenChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Bar dataKey="count" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity Chart */}
        {activityChartData.length > 0 && (
          <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Recent Activity (Last 7 Days)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#06b6d4" 
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="settled">Settled</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Token</label>
              <input
                type="text"
                value={filters.token}
                onChange={(e) => handleFilterChange('token', e.target.value)}
                placeholder="Filter by token..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Network</label>
              <input
                type="text"
                value={filters.network}
                onChange={(e) => handleFilterChange('network', e.target.value)}
                placeholder="Filter by network..."
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time Period</label>
              <select
                value={filters.timePeriod}
                onChange={(e) => handleFilterChange('timePeriod', e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="last3months">Last 3 Months</option>
                <option value="last6months">Last 6 Months</option>
                <option value="lastyear">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                disabled={filters.timePeriod !== 'custom' && filters.timePeriod !== ''}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                disabled={filters.timePeriod !== 'custom' && filters.timePeriod !== ''}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by transaction ID, recipient name, or account..."
                  className="w-full pl-10 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setFilters({
                status: '',
                token: '',
                network: '',
                search: '',
                startDate: '',
                endDate: '',
                timePeriod: '',
                page: 1,
                pageSize: 20
              })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-slate-900/50 backdrop-blur border border-slate-700 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-xl font-semibold text-white">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Token/Network</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Recipient</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Tx Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className={`text-sm font-medium capitalize ${
                          order.status === 'settled' ? 'text-green-400' :
                          order.status === 'pending' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white">
                        <div className="font-medium">{formatCurrency(order.amount)}</div>
                        <div className="text-sm text-slate-400">Paid: {formatCurrency(order.amountPaid)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white">
                        <div className="font-medium">{order.token.toUpperCase()}</div>
                        <div className="text-sm text-slate-400">{order.network}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">
                        <div className="font-medium">{order.recipient.accountName}</div>
                        <div className="text-sm text-slate-400">{order.recipient.institution}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-slate-400">
                        {order.txHash ? 
                          `${order.txHash.slice(0, 10)}...${order.txHash.slice(-8)}` :
                          'Pending'
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}