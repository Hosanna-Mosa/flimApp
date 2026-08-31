import { useCallback, useEffect, useState } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getNotificationRoute } from '@/utils/notificationRouting';
import { mapApiNotification, NotificationItem } from '@/utils/mappers';

/**
 * All Notifications-screen logic: initial load, mark-all-read on focus,
 * live socket inserts, pull-to-refresh, inline follow-request actions and
 * tap-to-open routing. The screen and its cards stay presentational.
 */
export function useNotificationsFeed() {
  const router = useRouter();
  const { token } = useAuth();
  const { socket } = useSocket();
  const { unreadCount, refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  /** Id of the follow-request notification currently being accepted/rejected. */
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (showLoadingState = true) => {
      if (!token) return;
      try {
        if (showLoadingState) setLoading(true);
        // Using the api wrapper handles response unwrapping
        const data: any = await api.getNotifications(token);

        if (Array.isArray(data)) {
          // 'message' notifications live in the Messages tab, not here.
          setNotifications(
            data.filter((n: any) => n.type !== 'message').map((n: any) => mapApiNotification(n))
          );
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
      } finally {
        if (showLoadingState) setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Mark all as read when screen is focused
  useFocusEffect(
    useCallback(() => {
      const markAllRead = async () => {
        if (!token) return;
        try {
          await api.markAllNotificationsRead(token);
          // Reset the badge count to 0
          refreshUnreadCount();
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch (error) {
          console.error('Failed to mark all as read:', error);
        }
      };
      markAllRead();
    }, [token, refreshUnreadCount])
  );

  // Live inserts
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (n: any) => {
      // Ignore message notifications in real-time
      if (n.type === 'message') return;
      setNotifications((prev) => [mapApiNotification(n, { time: 'Just now', isRead: false }), ...prev]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const refresh = async () => {
    setRefreshing(true);
    await loadNotifications(false);
    await refreshUnreadCount();
    setRefreshing(false);
  };

  const acceptRequest = async (notification: NotificationItem) => {
    const userId = notification.followerId || notification.actorId;
    if (!userId || !token) return;

    setProcessingRequest(notification.id);
    try {
      await api.acceptFollowRequest(userId, token);
      // Remove the notification after accepting
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshUnreadCount();
      // Emitting this in case it affects UI, though strictly it's "They follow Me"
      DeviceEventEmitter.emit('user_follow_changed', { userId, following: false }); // User is no longer "Requested"
    } catch (error) {
      console.error('Failed to accept follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const rejectRequest = async (notification: NotificationItem) => {
    const userId = notification.followerId || notification.actorId;
    if (!userId || !token) return;

    setProcessingRequest(notification.id);
    try {
      await api.rejectFollowRequest(userId, token);
      // Remove the notification after rejecting
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to reject follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const open = (notification: NotificationItem) => {
    // Follow requests are actioned inline (accept / reject), not opened.
    if (notification.type === 'follow_request') return;

    const route = getNotificationRoute({
      type: notification.type,
      ...notification.metadata,
      actorId: notification.actorId,
      followerId: notification.followerId,
    });
    if (route) router.push(route as any);
  };

  return {
    notifications,
    loading,
    refreshing,
    unreadCount,
    processingRequest,
    refresh,
    acceptRequest,
    rejectRequest,
    open,
  };
}
