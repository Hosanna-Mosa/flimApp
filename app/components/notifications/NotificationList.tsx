import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { NotificationItem } from '@/utils/mappers';
import { NotificationSkeleton } from '@/components/skeletons/NotificationSkeleton';
import EmptyState from '@/components/ui/EmptyState';
import NotificationCard from '@/components/notifications/NotificationCard';

interface NotificationListProps {
  loading: boolean;
  notifications: NotificationItem[];
  /** Id of the follow request currently being actioned, if any. */
  processingId: string | null;
  onPress: (notification: NotificationItem) => void;
  onAccept: (notification: NotificationItem) => void;
  onReject: (notification: NotificationItem) => void;
}

/** Body of the Notifications screen: skeleton, empty state, or the cards. */
export default function NotificationList({
  loading,
  notifications,
  processingId,
  onPress,
  onAccept,
  onReject,
}: NotificationListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom + 16, 20) : 16 },
      ]}
    >
      {loading ? (
        <View>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <NotificationSkeleton key={i} />
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          subtitle="Updates about your account will appear here."
        />
      ) : (
        notifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onPress={onPress}
            processing={processingId === notification.id}
            onAccept={onAccept}
            onReject={onReject}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
});
