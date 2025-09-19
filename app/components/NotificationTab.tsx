import React, { useState, useEffect } from 'react';
import { Bell, Trash2, X, Loader2 } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { addPaymentTransaction, PaymentTransaction } from '../utils/paymentStorage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

// Fallback UUID generator for environments without crypto.randomUUID
function uuidFallback() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export interface NotificationItem {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type?: string;
  isLocal?: boolean; // To distinguish between local and database notifications
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

export default function NotificationTab() {
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<NotificationItem[]>([]);
  const [dbNotifications, setDbNotifications] = useState<DatabaseNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const { wallets } = useWallets();
  
  const userAddress = wallets?.[0]?.address;

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

  // Mark notification as seen in database
  const markDbNotificationAsSeen = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'seen' }),
      });
    } catch (error) {
      console.error('Failed to mark notification as seen:', error);
    }
  };

  // Mark all database notifications as seen
  const markAllDbNotificationsAsSeen = async () => {
    const unseenNotifications = dbNotifications.filter(n => n.status === 'unseen');
    
    try {
      await Promise.all(
        unseenNotifications.map(notification =>
          fetch(`/api/notifications?id=${notification.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: 'seen' }),
          })
        )
      );
      // Refresh notifications after marking as seen
      await fetchDbNotifications();
    } catch (error) {
      console.error('Failed to mark all notifications as seen:', error);
    }
  };

  // Delete database notification
  const deleteDbNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDbNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Delete all database notifications
  const deleteAllDbNotifications = async () => {
    try {
      await Promise.all(
        dbNotifications.map(notification =>
          fetch(`/api/notifications?id=${notification.id}`, {
            method: 'DELETE',
          })
        )
      );
      setDbNotifications([]);
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  };

  // Listen for custom events to add local notifications (existing functionality)
  useEffect(() => {
    function handleNewNotification(e: CustomEvent) {
      setLocalNotifications((prev) => [
        {
          id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : uuidFallback(),
          message: e.detail.message,
          timestamp: new Date().toLocaleString(),
          read: false,
          type: e.detail.type || 'general',
          isLocal: true,
        },
        ...prev,
      ]);

      // Sync payment data with dashboard if notification is a payment
      if (e.detail && e.detail.type === 'payment' && e.detail.paymentData) {
        const tx: PaymentTransaction = {
          ...e.detail.paymentData,
          id: e.detail.paymentData.id || (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : uuidFallback()),
        };
        addPaymentTransaction(tx);
      }
    }
    window.addEventListener('neda-notification', handleNewNotification as EventListener);
    return () => window.removeEventListener('neda-notification', handleNewNotification as EventListener);
  }, []);

  // Fetch database notifications on component mount and when user address changes
  useEffect(() => {
    if (userAddress) {
      fetchDbNotifications();
    }
  }, [userAddress]);

  // Refresh database notifications when panel opens
  useEffect(() => {
    if (open && userAddress) {
      fetchDbNotifications();
    }
  }, [open, userAddress]);

  // Handle notification click (mark as seen for database notifications)
  const handleNotificationClick = async (notification: NotificationItem | DatabaseNotification) => {
    if ('status' in notification && notification.status === 'unseen') {
      await markDbNotificationAsSeen(notification.id);
      // Update local state
      setDbNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, status: 'seen' } : n)
      );
    }
  };

  // Mark all local notifications as read
  const markAllLocalRead = () => {
    setLocalNotifications((prev) => prev.map(n => ({ ...n, read: true })));
  };

  // Mark all notifications as read/seen
  const markAllRead = () => {
    markAllLocalRead();
    markAllDbNotificationsAsSeen();
  };

  // Delete local notification
  const deleteLocalNotification = (id: string) => {
    setLocalNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Delete all local notifications
  const deleteAllLocalNotifications = () => {
    setLocalNotifications([]);
  };

  // Delete all notifications
  const deleteAllNotifications = () => {
    deleteAllLocalNotifications();
    deleteAllDbNotifications();
  };

  // Calculate total unread/unseen count
  const unreadCount = localNotifications.filter(n => !n.read).length + 
                     dbNotifications.filter(n => n.status === 'unseen').length;

  // Combine and sort all notifications
  const allNotifications = [
    ...localNotifications.map(n => ({ ...n, createdAt: n.timestamp, isLocal: true })),
    ...dbNotifications.map(n => ({ 
      ...n, 
      read: n.status === 'seen', 
      timestamp: new Date(n.createdAt).toLocaleString(),
      isLocal: false 
    }))
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-slate-100 transition-colors duration-200"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold bg-red-500 hover:bg-red-500"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0 bg-white/95 backdrop-blur-md border border-slate-200/50 shadow-2xl" 
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-indigo-50/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
              )}
            </div>
            <div className="flex items-center gap-1">
              {allNotifications.length > 0 && (
                <>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                    onClick={markAllRead}
                    disabled={unreadCount === 0}
                  >
                    Mark all read
                  </Button>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={deleteAllNotifications}
                  >
                    Clear all
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-slate-100"
                onClick={() => setOpen(false)}
              >
                <X className="h-3 w-3 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[400px]">
          {allNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto mb-3 text-slate-400" />
              <p className="text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {allNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-indigo-50/20 transition-all cursor-pointer group relative ${
                    !notification.read 
                      ? 'bg-gradient-to-r from-indigo-50/50 to-purple-50/30 border-l-2 border-indigo-500' 
                      : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 animate-pulse"></div>
                        )}
                        <Badge 
                          variant={notification.type === 'payment_received' ? 'default' : 'secondary'}
                          className={`text-xs ${
                            notification.type === 'payment_received' 
                              ? 'bg-green-100 text-green-700 hover:bg-green-100'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {notification.type || 'general'}
                        </Badge>
                        {notification.isLocal && (
                          <Badge 
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-50"
                          >
                            local
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-slate-900 mb-2 break-words leading-relaxed">
                        {notification.message}
                      </div>
                      <div className="text-xs text-slate-500">
                        {notification.timestamp}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (notification.isLocal) {
                          deleteLocalNotification(notification.id);
                        } else {
                          deleteDbNotification(notification.id);
                        }
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}