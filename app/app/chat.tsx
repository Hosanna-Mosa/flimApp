import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import ChatScreenShell from '@/components/chat/ChatScreenShell';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import BlockedConversationBanner from '@/components/chat/BlockedConversationBanner';
import ChatInputBar from '@/components/chat/ChatInputBar';

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name: string }>();
  const c = useDirectMessages(userId, name);

  return (
    // No KeyboardAvoidingView here: ChatInputBar lifts itself on Android.
    <ChatScreenShell
      header={
        <ChatHeader
          title={c.userName}
          avatar={{ uri: c.userAvatar, userId, name: c.userName }}
          onTitlePress={c.openPeerProfile}
        />
      }
    >
      <ChatMessageList ref={c.listRef} messages={c.messages} peerId={userId} onDeleteMessage={c.deleteMessage} />
      {c.isConversationBlocked && (
        <BlockedConversationBanner isBlockedByMe={c.isBlockedByMe} onUnblock={c.unblock} />
      )}
      <ChatInputBar onSend={c.send} disabled={c.isConversationBlocked} />
    </ChatScreenShell>
  );
}
