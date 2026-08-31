import React from 'react';
import Screen from '@/components/layout/Screen';
import NotificationList from '@/components/notifications/NotificationList';
import { useNotificationsFeed } from '@/hooks/useNotificationsFeed';

export default function NotificationsScreen() {
  const n = useNotificationsFeed();

  return (
    <Screen
      title={n.unreadCount ? `Notifications (${n.unreadCount})` : 'Notifications'}
      edges={['top', 'bottom', 'left', 'right']}
      padded={false}
      refreshing={n.refreshing}
      onRefresh={n.refresh}
    >
      <NotificationList
        loading={n.loading}
        notifications={n.notifications}
        processingId={n.processingRequest}
        onPress={n.open}
        onAccept={n.acceptRequest}
        onReject={n.rejectRequest}
      />
    </Screen>
  );
}
