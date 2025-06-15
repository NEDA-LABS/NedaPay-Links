import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Eye, Clock, CheckCircle, XCircle, RotateCcw, Wallet } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

interface Transaction {
  id: string;
  createdAt: string;
  merchantId: string;
  status: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    transactions: Transaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
  error?: string;
}

const OffRampTransactionHistory = () => {
  const { user, authenticated } = usePrivy();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Get user's wallet address
  const userAddress = user?.wallet?.address;

  const fetchTransactions = async () => {
    if (!authenticated || !userAddress) {
      setError('Please connect your wallet to view transactions');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        merchantId: userAddress, // Use user's wallet address
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/offrampTransaction?${params}`);
      const data: ApiResponse = await response.json();

      if (data.success && data.data) {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when user connects wallet or page changes
  useEffect(() => {
    if (authenticated && userAddress) {
      fetchTransactions();
    }
  }, [authenticated, userAddress, currentPage]);

  const handleRefresh = () => {
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setTimeout(() => fetchTransactions(), 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'settled':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <RotateCcw className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'settled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  const truncateId = (id: string) => {
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My OffRamp Transactions</h1>
        <p className="text-gray-600">View your transaction history and status updates</p>
        {userAddress && (
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Wallet className="w-4 h-4" />
            <span className="font-mono">{userAddress}</span>
          </div>
        )}
      </div>

      {/* Not Connected State */}
      {!authenticated && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <Wallet className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Connect Your Wallet</h3>
          <p className="text-blue-700">Please connect your wallet to view your transaction history</p>
        </div>
      )}

      {/* Connected but no address */}
      {authenticated && !userAddress && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">Wallet Address Not Found</h3>
          <p className="text-yellow-700">Unable to retrieve your wallet address. Please try reconnecting.</p>
        </div>
      )}

      {/* Main Content - Only show when authenticated with address */}
      {authenticated && userAddress && (
        <>
          {/* Status Filter and Refresh */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="settled">Settled</option>
                  <option value="expired">Expired</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading your transactions...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          {!loading && !error && (
            <>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-mono text-gray-900">
                              {truncateId(transaction.id)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(transaction.status)}`}>
                              {getStatusIcon(transaction.status)}
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} transactions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={!pagination.hasPreviousPage}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm bg-blue-50 border border-blue-200 rounded-md">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={!pagination.hasNextPage}
                      className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {transactions.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-2">No transactions found</div>
                  <div className="text-sm text-gray-400">
                    {statusFilter ? 'Try changing your status filter' : 'You haven\'t made any offramp transactions yet'}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OffRampTransactionHistory;