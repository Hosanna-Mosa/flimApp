import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/layout/Screen';
import ConversationSearch from '@/components/messages/ConversationSearch';
import ConversationList from '@/components/messages/ConversationList';
import { useConversations } from '@/hooks/useConversations';

export default function MessagesScreen() {
  const router = useRouter();
  const m = useConversations();

  return (
    <Screen
      title="Messages"
      padded={false}
      refreshing={m.refreshing}
      onRefresh={m.onRefresh}
      contentStyle={{ paddingBottom: Platform.OS === 'android' ? 24 : 16 }}
    >
      <ConversationSearch value={m.searchQuery} onChangeText={m.setSearchQuery} />

      <ConversationList
        chats={m.chats}
        loading={m.loading}
        onPressChat={(chat) =>
          router.push({
            pathname: '/chat',
            params: { userId: chat.user.id, name: chat.user.name },
          })
        }
      />
    </Screen>
  );
}
