import React, { useState } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import ChatScreenShell from '@/components/chat/ChatScreenShell';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import BlockedConversationBanner from '@/components/chat/BlockedConversationBanner';
import ChatInputBar from '@/components/chat/ChatInputBar';
import MessageActionSheet, { MessageActionTarget } from '@/components/chat/MessageActionSheet';
import { DirectMessage } from '@/components/chat/ChatMessageBubble';

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name: string }>();
  const c = useDirectMessages(userId, name);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);

  const confirmCopied = () => {
    if (Platform.OS === 'android') ToastAndroid.show('Copied', ToastAndroid.SHORT);
    else Alert.alert('Copied');
  };

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
      <ChatMessageList
        ref={c.listRef}
        messages={c.messages}
        peerId={userId}
        onMessageLongPress={(message: DirectMessage, isMine: boolean) =>
          setActionTarget({ id: message.id, text: message.message, isMine })
        }
      />
      {c.isConversationBlocked && (
        <BlockedConversationBanner isBlockedByMe={c.isBlockedByMe} onUnblock={c.unblock} />
      )}
      <ChatInputBar onSend={c.send} disabled={c.isConversationBlocked} />

      <MessageActionSheet
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={c.deleteMessage}
        onCopied={confirmCopied}
      />
    </ChatScreenShell>
  );
}
