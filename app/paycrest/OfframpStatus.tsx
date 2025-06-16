import React, { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { X, Clock, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { fetchAllOrders } from '../utils/paycrest';
import axios from 'axios';
import { createPortal } from 'react-dom';

interface PaymentOrder {
  id: string;
  amount: string;
  amountPaid: string;
  token: string;
  network: string;
  reference: string;
  recipient: {
    institution: string;
    accountIdentifier: string;
    accountName: string;
    memo: string;
  };
  fromAddress: string;
  returnAddress: string;
  receiveAddress: string;
  createdAt: string;
  updatedAt: string;
  txHash: string;
  status: string;
  rate: string;
}

interface OrderHistoryResponse {
  message: string;
  status: string;
  data: {
    total: number;
    page: number;
    pageSize: number;
    orders: PaymentOrder[];
  };
}

const client_id = process.env.PAYCREST_CLIENT_ID;


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
      return <XCircle className="w-5 h-5 text-red-500" />;
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
      return 'bg-red-100 text-red-800';
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

const OrderHistoryModal = () => {
  const { wallets } = useWallets();
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const userAddress = wallets[0]?.address;

  interface FetchOrdersResponse {
    message: string;
    status: string;
    data: {
      total: number;
      page: number;
      pageSize: number;
      orders: PaymentOrder[];
    };
  }

  const fetchOrderHistory = async (page = 1) => {
    if (!userAddress) return;
  
    setLoading(true);
    setError(null);
  
    try {
      const params = {
        page,
        pageSize: 10, // Adjust based on your needs
      };
      const response = await fetch("https://api.paycrest.io/v1/sender/orders", {
        headers: {
          "Content-Type": "application/json",
          "API-Key": `${client_id}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let res = await response.json();

      console.log("response debugg", res) //debugging
      if (res.status !== 'success') {
        throw new Error('Failed to fetch orders');
      }
  
      // Filter orders by user's address
      const userOrders = res.data.orders.filter(
        (order: PaymentOrder) => order.fromAddress.toLowerCase() === userAddress.toLowerCase()
      );
  
      console.log("user orders", userOrders); // Debugging
      setOrders(userOrders);
      setTotalPages(Math.ceil(res.data.total / (params.pageSize || 10)));
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
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
              <p className="text-gray-500 text-sm mt-2">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(order.status)}
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {order.amount} {order.token}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600 mb-1">Recipient</p>
                        <p className="font-medium text-gray-900">{order.recipient?.accountName}</p>
                        <p className="text-gray-500">{order.recipient?.institution}</p>
                        <p className="text-gray-500">{order.recipient?.accountIdentifier}</p>
                      </div>
                      
                      <div>
                        <p className="text-gray-600 mb-1">Transaction Details</p>
                        <p className="text-gray-900">Network: <span className="font-medium">{order.network?.toUpperCase()}</span></p>
                        <p className="text-gray-900">Rate: <span className="font-medium">{order.rate}</span></p>
                        {order.reference && (
                          <p className="text-gray-900">Reference: <span className="font-medium">{order.reference}</span></p>
                        )}
                      </div>
                    </div>

                    {order.recipient?.memo && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-gray-600 text-sm mb-1">Memo</p>
                        <p className="text-gray-900 text-sm">{order.recipient.memo}</p>
                      </div>
                    )}

                    {order.txHash && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <a
                          href={`https://basescan.org/tx/${order.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View Transaction <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
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
        className="px-3 py-2 !border !border-blue-600 !bg-slate-50 hover:!bg-blue-700 text-black hover:!text-white font-medium !rounded-3xl transition-colors duration-200 flex items-center gap-2 text-xs"
      >
        <Clock className="w-4 h-4" />
        Offramp History
      </button>

      {isOpen && createPortal(modalContent, document.body)}
    </>
  );
};

export default OrderHistoryModal;