import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Bell, CheckCircle2, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  isRead: boolean;
};

const mockNotifications: NotificationItem[] = [
  {
    id: '1',
    title: 'New follower',
    description: 'Priya Verma started following you.',
    time: '2h ago',
    isRead: false,
  },
  {
    id: '2',
    title: 'Collaboration invite',
    description: 'Rohan invited you to join “Indie Short Film”.',
    time: '5h ago',
    isRead: false,
  },
  {
    id: '3',
    title: 'Comment on your post',
    description: 'Aditi commented: “Love this shot!”',
    time: '1d ago',
    isRead: true,
  },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [notifications, setNotifications] =
    useState<NotificationItem[]>(mockNotifications);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
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
              onPress={() => markRead(notification.id)}
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

