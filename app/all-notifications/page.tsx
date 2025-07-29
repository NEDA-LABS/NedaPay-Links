"use client";
import { useState, useEffect } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { X, Clock, CheckCircle, XCircle, AlertCircle, DollarSign, Building2, CreditCard } from 'lucide-react';
import axios from 'axios';

// Fallback UUID generator
function uuidFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Interfaces
interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: string;
  isLocal?: boolean;
}

interface DatabaseNotification {
  id: string;
  message: string;
  recipient: string;
  type: string;
  status: 'seen' | 'unseen';
  createdAt: string;
  relatedTransactionId?: string;
}

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

interface EventItem {
  id: string;
  type: 'notification' | 'transaction';
  timestamp: string;
  data: NotificationItem | DatabaseNotification | OffRampTransaction;
}

// Utility functions for transactions
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
    minute: '2-digit',
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

const MasterNotificationCenter: React.FC = () => {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);
  const [dbNotifications, setDbNotifications] = useState<DatabaseNotification[]>([]);
  const [offrampTransactions, setOfframpTransactions] = useState<OffRampTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'notifications' | 'transactions'>('all');
  const userAddress = user?.wallet?.address || wallets?.[0]?.address;

  // Fetch database notifications
  const fetchDbNotifications = async () => {
    if (!userAddress) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?recipient=${userAddress}`);
      if (response.ok) {
        const notifications = await response.json();
        setDbNotifications(notifications);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch offramp transactions
  const fetchOfframpTransactions = async () => {
    if (!userAddress) return;
    setLoading(true);
    try {
      const response = await axios.get('/api/paycrest/orders-history', {
        params: { wallet: userAddress, page: 1, pageSize: 10 },
      });
      if (response.data.status === 'success') {
        setOfframpTransactions(response.data.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as seen
  const markDbNotificationAsSeen = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'seen' }),
      });
      setDbNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, status: 'seen' } : n))
      );
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  // Delete database notification
  const deleteDbNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDbNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Delete local notification
  const deleteLocalNotification = (id: string) => {
    setLocalNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Handle local notifications
  useEffect(() => {
    const handleNewNotification = (e: CustomEvent) => {
      setLocalNotifications((prev) => [
        {
          id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : uuidFallback(),
          message: e.detail.message,
          timestamp: new Date().toLocaleString(),
          read: false,
          type: e.detail.type || 'general',
          isLocal: true,
        },
        ...prev,
      ]);
    };
    window.addEventListener('neda-notification', handleNewNotification as EventListener);
    return () => window.removeEventListener('neda-notification', handleNewNotification as EventListener);
  }, []);

  // Fetch data on mount and when userAddress changes
  useEffect(() => {
    if (userAddress) {
      fetchDbNotifications();
      fetchOfframpTransactions();
    }
  }, [userAddress]);

  // Combine and sort events
  const allEvents: EventItem[] = [
    ...localNotifications.map((n) => ({ id: n.id, type: 'notification' as const, timestamp: n.timestamp, data: n })),
    ...dbNotifications.map((n) => ({
      id: n.id,
      type: 'notification' as const,
      timestamp: n.createdAt,
      data: { ...n, read: n.status === 'seen', timestamp: n.createdAt },
    })),
    ...offrampTransactions.map((t) => ({ id: t.id, type: 'transaction' as const, timestamp: t.createdAt, data: t })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const filteredEvents = filter === 'all' ? allEvents : allEvents.filter((e) => e.type === filter.replace('s', ''));

  // Calculate unread notification count
  const unreadCount = localNotifications.filter((n) => !n.read).length + dbNotifications.filter((n) => n.status === 'unseen').length;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-md p-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Master Notification Center</h1>
            <p className="text-sm text-gray-600 mt-1">Stay updated with your notifications and transactions</p>
          </div>
          {unreadCount > 0 && (
            <div className="relative">
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex space-x-4 mb-6">
          {(['all', 'notifications', 'transactions'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium capitalize ${
                filter === f ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              } transition-colors`}
            >
              {f}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No items to display</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) =>
              event.type === 'notification' ? (
                <div
                  key={event.id}
                  className={`p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 flex justify-between items-start ${
                    (event.data as NotificationItem).read === false || (event.data as DatabaseNotification).status === 'unseen' ? 'border-l-4 border-blue-500' : ''
                  } transition-colors`}
                >
                  <div
                    className="flex-1"
                    onClick={() => {
                      const data = event.data as NotificationItem | DatabaseNotification;
                      if ('read' in data && !data.read && !data.isLocal) {
                        markDbNotificationAsSeen(event.id);
                      } else if ('status' in data && data.status === 'unseen') {
                        markDbNotificationAsSeen(event.id);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {(event.data as NotificationItem).read === false || (event.data as DatabaseNotification).status === 'unseen' && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          (event.data as NotificationItem | DatabaseNotification).type === 'payment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {(event.data as NotificationItem | DatabaseNotification).type || 'general'}
                      </span>
                      {(event.data as NotificationItem).isLocal && (
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">local</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-1 break-words">
                      {(event.data as NotificationItem | DatabaseNotification).message}
                    </p>
                    <p className="text-xs text-gray-500">{(event.data as NotificationItem).timestamp || (event.data as DatabaseNotification).createdAt}</p>
                  </div>
                  <button
                    onClick={() => {
                      const data = event.data as NotificationItem | DatabaseNotification;
                      if ('isLocal' in data) {
                        if (data.isLocal) {
                          deleteLocalNotification(event.id);
                        } else {
                          deleteDbNotification(event.id);
                        }
                      } else {
                        deleteDbNotification(event.id);
                      }
                    }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div key={event.id} className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon((event.data as OffRampTransaction).status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Transaction ID: {(event.data as OffRampTransaction).id.slice(0, 8)}...
                        </p>
                        <p className="text-xs text-gray-500">{formatDate((event.data as OffRampTransaction).createdAt)}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        (event.data as OffRampTransaction).status
                      )}`}
                    >
                      {(event.data as OffRampTransaction).status.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatAmount((event.data as OffRampTransaction).amount, (event.data as OffRampTransaction).currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Account</p>
                        <p className="text-sm font-medium text-gray-900">{(event.data as OffRampTransaction).accountName}</p>
                        <p className="text-xs text-gray-500">
                          {(event.data as OffRampTransaction).accountNumber !== 'N/A'
                            ? `****${(event.data as OffRampTransaction).accountNumber.slice(-4)}`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Institution</p>
                        <p className="text-sm font-medium text-gray-900">{(event.data as OffRampTransaction).institution}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MasterNotificationCenter;