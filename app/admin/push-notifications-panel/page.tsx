// admin/push-notifications-panel/NotificationDashboard.tsx
'use client';

import { useState, useEffect } from 'react';

interface NotificationAnalytics {
  total: number;
  seen: number;
  unseen: number;
}

interface BroadcastNotificationWithAnalytics {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
  analytics: NotificationAnalytics;
}

export default function NotificationDashboard() {
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<BroadcastNotificationWithAnalytics[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (): Promise<void> => {
    try {
      const response = await fetch('/api/notifications/broadCastNotifications/manage');
      if (response.ok) {
        const data: BroadcastNotificationWithAnalytics[] = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      const response = await fetch('/api/notifications/broadCastNotifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, message }),
      });
      
      if (response.ok) {
        setTitle('');
        setMessage('');
        alert('Notification sent successfully!');
        fetchNotifications(); // Refresh the list
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error) {
      alert('Error sending notification: ' + (error as Error).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this notification? This will remove it for all users.')) {
      return;
    }

    setIsDeleting(id);
    try {
      const response = await fetch(`/api/notifications/broadCastNotifications/manage?id=${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('Notification deleted successfully!');
        fetchNotifications(); // Refresh the list
      } else {
        throw new Error('Failed to delete notification');
      }
    } catch (error) {
      alert('Error deleting notification: ' + (error as Error).message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-purple-400 mb-8">Notification Dashboard</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Send Broadcast Notification</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-1">
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              ></textarea>
            </div>
            
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50 transition-colors"
            >
              {isSending ? 'Sending...' : 'Broadcast Notification'}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-blue-400 mb-4">Broadcast History & Analytics</h2>
          {notifications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="text-left border-b border-slate-700">
                    <th className="pb-2">Title</th>
                    <th className="pb-2">Message</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2 text-center">Total Sent</th>
                    <th className="pb-2 text-center">Seen</th>
                    <th className="pb-2 text-center">Unseen</th>
                    <th className="pb-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notification) => (
                    <tr key={notification.id} className="border-b border-slate-700">
                      <td className="py-3 pr-4">{notification.title}</td>
                      <td className="py-3 pr-4">{notification.message}</td>
                      <td className="py-3 pr-4 whitespace-nowrap">
                        {new Date(notification.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4 text-center">{notification.analytics.total}</td>
                      <td className="py-3 pr-4 text-center text-green-400">
                        {notification.analytics.seen}
                      </td>
                      <td className="py-3 pr-4 text-center text-yellow-400">
                        {notification.analytics.unseen}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isDeleting === notification.id}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50 transition-colors text-sm"
                        >
                          {isDeleting === notification.id ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-400">No notifications sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}