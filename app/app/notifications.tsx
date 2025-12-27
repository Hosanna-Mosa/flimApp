import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Bell, CheckCircle2, Clock, Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiNotifications, apiMarkAllNotificationsRead, apiAcceptFollowRequest, apiRejectFollowRequest } from '@/utils/api';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: string;
  metadata: any;
  actorId?: string;
  followerId?: string;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  const { socket } = useSocket();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await apiNotifications(token);
      if (Array.isArray(data)) {
        // Filter out 'message' type notifications as requested
        const items = data
          .filter((n: any) => n.type !== 'message')
          .map((n: any) => ({
            id: n._id,
            title: n.title,
            description: n.body,
            time: new Date(n.createdAt).toLocaleString(),
            isRead: n.isRead,
            type: n.type,
            metadata: n.metadata || {},
            actorId: n.actor?._id || n.metadata?.actorId,
            followerId: n.metadata?.followerId || n.actor?._id,
          }));
        setNotifications(items);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [token]);

  // Mark all as read when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const markAllRead = async () => {
        if (!token) return;
        try {
          // Mark all notifications as read on backend
          await apiMarkAllNotificationsRead(token);
          // Reset the badge count to 0
          refreshUnreadCount();
          // Update local state to show all as read
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true }))
          );
        } catch (error) {
          console.error('Failed to mark all as read:', error);
        }
      };
      markAllRead();
    }, [token, refreshUnreadCount])
  );

  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (n: any) => {
      // Ignore message notifications in real-time
      if (n.type === 'message') return;

      setNotifications((prev) => [
        {
          id: n._id,
          title: n.title,
          description: n.body,
          time: 'Just now',
          isRead: false,
          type: n.type,
          metadata: n.metadata || {},
          actorId: n.actor?._id || n.metadata?.actorId,
          followerId: n.metadata?.followerId || n.actor?._id,
        },
        ...prev,
      ]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    await refreshUnreadCount();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (notification: NotificationItem) => {
    const userId = notification.followerId || notification.actorId;
    if (!userId || !token) return;

    setProcessingRequest(notification.id);
    try {
      await apiAcceptFollowRequest(userId, token);
      // Remove the notification after accepting
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to accept follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleRejectRequest = async (notification: NotificationItem) => {
    const userId = notification.followerId || notification.actorId;
    if (!token) return;

    setProcessingRequest(notification.id);
    try {
      await apiRejectFollowRequest(userId, token);
      // Remove the notification after rejecting
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to reject follow request:', error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleNotificationPress = (notification: NotificationItem) => {
    const { type, metadata } = notification;

    // Don't navigate for follow_request - user can accept/reject
    if (type === 'follow_request') {
      return;
    }

    // Navigate based on notification type
    switch (type) {
      case 'like':
      case 'comment':
      case 'reply':
        // Navigate to post detail page
        if (metadata?.postId) {
          router.push(`/post/${metadata.postId}`);
        }
        break;

      case 'follow':
        // Navigate to the follower's profile
        if (metadata?.followerId || metadata?.actorId) {
          const userId = metadata.followerId || metadata.actorId;
          router.push({
            pathname: '/user/[id]',
            params: { id: userId }
          });
        }
        break;

      case 'message':
        // Navigate to chat with the sender
        if (metadata?.actorId) {
          router.push({
            pathname: '/chat',
            params: { userId: metadata.actorId }
          });
        }
        break;

      default:
        // For other types, just mark as read
        break;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: unreadCount
            ? `Notifications (${unreadCount})`
            : 'Notifications',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Updates about your account will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              onPress={() => handleNotificationPress(notification)}
              activeOpacity={0.85}
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: notification.isRead
                    ? colors.border
                    : colors.primary,
                },
              ]}
            >
              <View
                style={[
                  styles.iconWrap,
                  {
                    backgroundColor: notification.isRead
                      ? `${colors.textSecondary}20`
                      : `${colors.primary}20`,
                  },
                ]}
              >
                {notification.isRead ? (
                  <CheckCircle2 size={20} color={colors.textSecondary} />
                ) : (
                  <Bell size={20} color={colors.primary} />
                )}
              </View>
              <View style={styles.cardContent}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {notification.title}
                </Text>
                <Text
                  style={[styles.description, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {notification.description}
                </Text>
                <View style={styles.meta}>
                  <Clock size={14} color={colors.textSecondary} />
                  <Text style={[styles.time, { color: colors.textSecondary }]}>
                    {notification.time}
                  </Text>
                </View>
                {notification.type === 'follow_request' && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.acceptButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleAcceptRequest(notification)}
                      disabled={processingRequest === notification.id}
                    >
                      {processingRequest === notification.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Check size={16} color="#fff" />
                          <Text style={styles.buttonText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rejectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => handleRejectRequest(notification)}
                      disabled={processingRequest === notification.id}
                    >
                      {processingRequest === notification.id ? (
                        <ActivityIndicator size="small" color={colors.text} />
                      ) : (
                        <>
                          <X size={16} color={colors.text} />
                          <Text style={[styles.buttonText, { color: colors.text }]}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  time: {
    fontSize: 13,
  },
  emptyState: {
    marginTop: 64,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
