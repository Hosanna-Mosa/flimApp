import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { NotificationItem } from '@/utils/mappers';
import NotificationIcon from '@/components/notifications/NotificationIcon';
import FollowRequestActions from '@/components/notifications/FollowRequestActions';

interface NotificationCardProps {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
  /** True while this card's follow request is being accepted/rejected. */
  processing?: boolean;
  onAccept?: (notification: NotificationItem) => void;
  onReject?: (notification: NotificationItem) => void;
}

/**
 * One notification row: unread cards get a primary border and bell icon,
 * read cards a neutral border and tick. follow_request cards also carry
 * inline Accept / Reject actions.
 */
export default function NotificationCard({
  notification,
  onPress,
  processing = false,
  onAccept,
  onReject,
}: NotificationCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: notification.isRead ? colors.border : colors.primary,
        },
      ]}
    >
      <NotificationIcon isRead={notification.isRead} />
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {notification.description}
        </Text>
        <View style={styles.meta}>
          <Clock size={14} color={colors.textSecondary} />
          <Text style={[styles.time, { color: colors.textSecondary }]}>{notification.time}</Text>
        </View>
        {notification.type === 'follow_request' && (
          <FollowRequestActions
            loading={processing}
            onAccept={() => onAccept?.(notification)}
            onReject={() => onReject?.(notification)}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 14,
  },
});
