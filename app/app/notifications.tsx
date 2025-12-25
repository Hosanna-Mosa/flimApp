import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Bell, CheckCircle2, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { apiNotifications, apiMarkAllNotificationsRead } from '@/utils/api';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
  type: string;
  metadata: any;
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  const { socket } = useSocket();
  const { unreadCount, refreshUnreadCount } = useNotifications();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await apiNotifications(token);
      if (Array.isArray(data)) {
        const items = data.map((n: any) => ({
          id: n._id,
          title: n.title,
          description: n.body,
          time: new Date(n.createdAt).toLocaleString(),
          isRead: n.isRead,
          type: n.type,
          metadata: n.metadata || {},
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
      setNotifications((prev) => [
        {
          id: n._id,
          title: n.title,
          description: n.body,
          time: 'Just now',
          isRead: false,
          type: n.type,
          metadata: n.metadata || {},
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

  const handleNotificationPress = (notification: NotificationItem) => {
    const { type, metadata } = notification;

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
});
