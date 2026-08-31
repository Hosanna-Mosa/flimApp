import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MessageCircle, Bell, HandCoins } from 'lucide-react-native';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMessages } from '@/contexts/MessageContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';

/**
 * Right-hand header cluster on the home tab: donations, notifications and
 * messages, the latter two badged with their live unread counts.
 */
export default function HomeHeaderActions() {
  const router = useRouter();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useMessages();

  return (
    <View style={styles.row}>
      <HeaderIconButton
        icon={HandCoins}
        accessibilityLabel="Donations"
        onPress={() => router.push('/donations')}
      />
      <HeaderIconButton
        icon={Bell}
        accessibilityLabel="Notifications"
        badgeCount={notificationCount}
        onPress={() => router.push('/notifications')}
      />
      <HeaderIconButton
        icon={MessageCircle}
        accessibilityLabel="Messages"
        badgeCount={messageCount}
        onPress={() => router.push('/messages')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
});
