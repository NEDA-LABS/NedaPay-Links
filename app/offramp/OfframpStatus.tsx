import React, { useState, useEffect } from 'react';
import { useWallets,usePrivy } from '@privy-io/react-auth';
import { X, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Building2, CreditCard } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';

interface OffRampTransaction {
  id: string;
  createdAt: string;
  merchantId: string;
  status: string;
  amount: string;
  currency: string;
  accountName: string;
  accountNumber: string;
  institution: string;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'settled':
    case 'completed':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'pending':
    case 'processing':
      return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'failed':
    case 'cancelled':
    case 'expired':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'refunded':
      return <AlertCircle className="w-5 h-5 text-orange-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'settled':
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
    case 'processing':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
    case 'cancelled':
    case 'expired':
      return 'bg-red-100 text-red-800';
    case 'refunded':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatAmount = (amount: string, currency: string) => {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount)) return `${currency} ${amount}`;
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(numAmount);
};

const OrderHistoryModal = () => {
  const { user } = usePrivy();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<OffRampTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userAddress = user?.wallet?.address;

  const fetchOrderHistory = async (page = 1) => {
    if (!userAddress) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/paycrest/orders-history', {
        params: {
          wallet: userAddress,
          page,
          pageSize: 10,
        },
      });

      const res = response.data;

      if (res.status !== 'success') {
        throw new Error('Failed to fetch orders');
      }

      setOrders(res.data.transactions);
      setTotalPages(Math.ceil(res.data.total / 10));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load order history';
      setError(errorMessage);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsOpen(true);
    setCurrentPage(1);
    fetchOrderHistory(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchOrderHistory(page);
  };

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Offramp History</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:!bg-gray-100 !rounded-full !transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading orders...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium">{error}</p>
              <button
                onClick={() => fetchOrderHistory(currentPage)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No orders found</p>
              <p className="text-gray-500 text-sm mt-2">Your offramp/withdraw history will appear here</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Transaction ID: {order.id.slice(0, 8)}...
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                      {/* Amount */}
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Amount</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(order.amount, order.currency)}
                          </p>
                        </div>
                      </div>

                      {/* Account */}
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Account</p>
                          <p className="text-sm font-medium text-gray-900">{order.accountName}</p>
                          <p className="text-xs text-gray-500">
                            {order.accountNumber !== 'N/A' ? `****${order.accountNumber.slice(-4)}` : order.accountNumber}
                          </p>
                        </div>
                      </div>

                      {/* Institution */}
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Institution</p>
                          <p className="text-sm font-medium text-gray-900">{order.institution}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="px-3 py-3 w-full !border !border-blue-600 !bg-slate-50 hover:!bg-blue-700 text-black hover:!text-white font-medium !rounded-lg transition-colors duration-200 flex items-center gap-2 text-sm"
      >
        <Clock className="w-4 h-4" />
        Offramp History
      </button>

      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
};

export default OrderHistoryModal;