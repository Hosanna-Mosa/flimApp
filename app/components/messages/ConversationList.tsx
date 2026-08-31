import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { MessageSkeleton } from '@/components/skeletons/MessageSkeleton';
import UserRow from '@/components/ui/UserRow';
import EmptyState from '@/components/ui/EmptyState';
import UnreadCountPill from '@/components/messages/UnreadCountPill';
import { ConversationItem } from '@/hooks/useConversations';

interface ConversationListProps {
  chats: ConversationItem[];
  /** Shows skeleton rows instead of the list. */
  loading: boolean;
  onPressChat: (chat: ConversationItem) => void;
}

/** Conversation rows (UserRow cards with last message, time and unread pill), plus the empty state. */
export default function ConversationList({ chats, loading, onPressChat }: ConversationListProps) {
  return (
    <>
      {loading ? (
        <View>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <MessageSkeleton key={i} />
          ))}
        </View>
      ) : (
        chats.map((chat) => (
          <UserRow
            key={chat.id}
            variant="card"
            avatarSize={56}
            user={{
              id: chat.user.id,
              name: chat.user.name,
              avatar: chat.user.avatar,
              isVerified: chat.user.isVerified,
            }}
            meta={chat.lastMessageTime}
            subtitle={chat.lastMessage}
            emphasized={chat.unreadCount > 0}
            trailing={chat.unreadCount > 0 ? <UnreadCountPill count={chat.unreadCount} /> : undefined}
            style={styles.chatItem}
            onPress={() => onPressChat(chat)}
          />
        ))
      )}

      {chats.length === 0 && <EmptyState icon={MessageCircle} title="No conversations yet" />}
    </>
  );
}

const styles = StyleSheet.create({
  chatItem: {
    marginHorizontal: 16,
  },
});
