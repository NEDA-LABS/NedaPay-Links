// components/BroadcastNotificationListener.tsx
'use client';
import { useState, useEffect, JSX } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Notification, NotificationState } from '@/admin/push-notifications-panel/types';

// Cache to prevent processing the same notification multiple times
const processedNotifications = new Set<string>();

export default function BroadcastNotificationListener(): JSX.Element {
  const { user } = usePrivy();
  const [visibleNotifications, setVisibleNotifications] = useState<Record<string, NotificationState>>({});

  // Function to check if broadcastId already exists for this user
  const checkBroadcastIdExists = async (broadcastId: string): Promise<boolean> => {
    if (!user?.wallet?.address) return false;

    try {
      const response = await fetch(
        `/api/notifications?recipient=${user.wallet.address}&broadcastId=${broadcastId}`
      );
      
      if (response.ok) {
        const notifications = await response.json();
        return notifications.length > 0;
      }
      return false;
    } catch (error) {
      console.error('Error checking broadcastId existence:', error);
      return false;
    }
  };

  // Function to save broadcast notification to individual user notifications
  const saveNotificationToUserDB = async (broadcastNotification: Notification): Promise<void> => {
    if (!user?.wallet?.address) return;

    // Check if we've already processed this notification
    if (processedNotifications.has(broadcastNotification.id)) {
      return;
    }

    // Check if broadcastId already exists in user's notifications
    const exists = await checkBroadcastIdExists(broadcastNotification.id);
    if (exists) {
      processedNotifications.add(broadcastNotification.id);
      return; // Don't post if it already exists
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: broadcastNotification.message,
          recipient: user.wallet.address,
          type: 'broadcast',
          status: 'unseen',
          relatedTransactionId: null,
          broadcastId: broadcastNotification.id,
        }),
      });

      if (response.ok) {
        processedNotifications.add(broadcastNotification.id);
      } else {
        const errorData = await response.json();
        console.error('Failed to save notification to user database:', errorData);
      }
    } catch (error) {
      console.error('Error saving notification to user database:', error);
    }
  };

  // Function to fetch user's unseen broadcast notifications
  const fetchUnseenBroadcastNotifications = async (): Promise<any[]> => {
    if (!user?.wallet?.address) return [];

    try {
      const response = await fetch(
        `/api/notifications?recipient=${user.wallet.address}&type=broadcast&status=unseen`
      );
      
      if (response.ok) {
        const notifications = await response.json();
        return notifications;
      }
      return [];
    } catch (error) {
      console.error('Error fetching unseen broadcast notifications:', error);
      return [];
    }
  };

  // Function to mark notification as seen
  const markNotificationAsSeen = async (broadcastId: string): Promise<void> => {
    if (!user?.wallet?.address) return;

    try {
      const updateResponse = await fetch(
        `/api/notifications?broadcastId=${broadcastId}&recipient=${user.wallet.address}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'seen',
          }),
        }
      );

      if (!updateResponse.ok) {
        console.error('Failed to mark notification as seen');
      }
    } catch (error) {
      console.error('Error marking notification as seen:', error);
    }
  };

  useEffect(() => {
    const processNotifications = async (): Promise<void> => {
      if (!user?.wallet?.address) return;

      try {
        // First, fetch broadcast notifications from the broadcast API
        const broadcastResponse = await fetch('/api/notifications/broadCastNotifications');
        if (broadcastResponse.ok) {
          const broadcastNotifications: Notification[] = await broadcastResponse.json();
          
          // Save new broadcast notifications to individual user database
          for (const notification of broadcastNotifications) {
            // Skip if already processed
            if (processedNotifications.has(notification.id)) continue;
            
            await saveNotificationToUserDB(notification);
          }
        }

        // Then, fetch unseen broadcast notifications from individual notifications database
        const unseenNotifications = await fetchUnseenBroadcastNotifications();
        
        // Process unseen notifications for display
        unseenNotifications.forEach((notification) => {
          const broadcastId = notification.broadcastId;
          
          // Show notification if not already visible
          if (broadcastId && !visibleNotifications[broadcastId]) {
            const newVisibleNotification: NotificationState = {
              id: broadcastId,
              title: '', // Empty string as requested
              message: notification.message,
              createdAt: notification.createdAt,
              updatedAt: notification.updatedAt,
              isVisible: true,
              isClosable: false
            };
            
            setVisibleNotifications(prev => ({
              ...prev,
              [broadcastId]: newVisibleNotification
            }));
            
            // Make closable after 5 seconds
            setTimeout(() => {
              setVisibleNotifications(prev => ({
                ...prev,
                [broadcastId]: {
                  ...prev[broadcastId],
                  isClosable: true
                }
              }));
            }, 5000);
          }
        });
      } catch (error) {
        console.error('Error processing notifications:', error);
      }
    };

    // Only run if user is authenticated
    if (user?.wallet?.address) {
      processNotifications();
      const interval = setInterval(processNotifications, 30000); // Reduced from 10s to 30s for efficiency
      return () => clearInterval(interval);
    }
  }, [user?.wallet?.address, visibleNotifications]);

  const handleClose = async (broadcastId: string): Promise<void> => {
    // Mark notification as seen in the database
    await markNotificationAsSeen(broadcastId);
    
    // Remove from visible notifications
    setVisibleNotifications(prev => {
      const updated = { ...prev };
      delete updated[broadcastId];
      return updated;
    });
  };

  // Don't render if user is not authenticated
  if (!user?.wallet?.address) {
    return <></>;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {Object.values(visibleNotifications)
        .filter(notification => notification.isVisible)
        .map(notification => (
          <div
            key={notification.id}
            className="p-4 bg-slate-800 border-l-4 border-purple-500 rounded-lg shadow-lg max-w-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-blue-300">{notification.title}</h3>
                <p className="text-slate-200 text-sm mt-1">{notification.message}</p>
              </div>
              {notification.isClosable && (
                <button
                  onClick={() => handleClose(notification.id)}
                  className="text-slate-400 hover:text-slate-200 ml-2"
                  aria-label="Close notification"
                >
                  ×
                </button>
              )}
            </div>
            {!notification.isClosable && (
              <div className="w-full bg-slate-700 h-1 mt-2">
                <div
                  className="bg-purple-500 h-1 transition-all duration-5000 ease-linear"
                  style={{ width: '100%' }}
                />
              </div>
            )}
          </div>
        ))}
    </div>
  );
}