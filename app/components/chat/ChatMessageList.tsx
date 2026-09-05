import React, { forwardRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import ChatMessageBubble, { DirectMessage, DirectMessageMedia } from './ChatMessageBubble';

interface ChatMessageListProps {
  messages: DirectMessage[];
  /** The other participant; any message not from them is the viewer's. */
  peerId?: string;
  onMessageLongPress: (message: DirectMessage, isMine: boolean) => void;
  onPressMedia: (media: DirectMessageMedia) => void;
}

/**
 * Bottom-anchored direct-message list. Forwards the FlatList ref so the
 * owning hook can scrollToEnd after sending/receiving.
 */
const ChatMessageList = forwardRef<FlatList<DirectMessage>, ChatMessageListProps>(function ChatMessageList(
  { messages, peerId, onMessageLongPress, onPressMedia },
  ref
) {
  const scrollToEnd = (animated: boolean) => {
    if (ref && typeof ref !== 'function') ref.current?.scrollToEnd({ animated });
  };

  return (
    <FlatList
      ref={ref}
      style={styles.list}
      data={messages}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onContentSizeChange={() => scrollToEnd(true)}
      onLayout={() => scrollToEnd(false)}
      renderItem={({ item, index }) => {
        // Fallback: if the sender is NOT the peer, it is me.
        const isMe = String(item.senderId) !== String(peerId);
        const prev = messages[index - 1];
        const next = messages[index + 1];
        return (
          <ChatMessageBubble
            message={item}
            isMe={isMe}
            isFirstInGroup={!prev || String(prev.senderId) !== String(item.senderId)}
            isLastInGroup={!next || String(next.senderId) !== String(item.senderId)}
            onLongPress={onMessageLongPress}
            onPressMedia={onPressMedia}
          />
        );
      }}
    />
  );
});

export default ChatMessageList;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end', // Keeps messages at bottom if few
  },
});
