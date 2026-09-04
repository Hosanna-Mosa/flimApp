import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import MessageStatusTicks, { MessageStatus } from './MessageStatusTicks';
import LinkifiedText from './LinkifiedText';

export interface DirectMessage {
  id: string;
  senderId: string;
  message: string;
  /** Already formatted for display ("12:44 PM"). */
  timestamp: string;
  status: MessageStatus;
}

interface ChatMessageBubbleProps {
  message: DirectMessage;
  isMe: boolean;
  /** Group consecutive messages from the same sender (Instagram-style). */
  isFirstInGroup: boolean;
  isLastInGroup: boolean;
  /** Fired for any message — the menu decides which actions apply. */
  onLongPress?: (message: DirectMessage, isMine: boolean) => void;
}

const ROUND_CORNER = 18;
const TIGHT_CORNER = 4;

/**
 * One direct-message bubble. The shared edge between grouped bubbles gets a
 * tight corner instead of a full round, so a burst of messages reads as one
 * chain instead of a stack of separate boxes. Own messages show status ticks.
 */
export default function ChatMessageBubble({
  message,
  isMe,
  isFirstInGroup,
  isLastInGroup,
  onLongPress,
}: ChatMessageBubbleProps) {
  const { colors } = useTheme();

  const bubbleShape = isMe
    ? {
        borderTopLeftRadius: ROUND_CORNER,
        borderBottomLeftRadius: ROUND_CORNER,
        borderTopRightRadius: isFirstInGroup ? ROUND_CORNER : TIGHT_CORNER,
        borderBottomRightRadius: isLastInGroup ? ROUND_CORNER : TIGHT_CORNER,
      }
    : {
        borderTopRightRadius: ROUND_CORNER,
        borderBottomRightRadius: ROUND_CORNER,
        borderTopLeftRadius: isFirstInGroup ? ROUND_CORNER : TIGHT_CORNER,
        borderBottomLeftRadius: isLastInGroup ? ROUND_CORNER : TIGHT_CORNER,
      };

  return (
    <TouchableOpacity onLongPress={() => onLongPress?.(message, isMe)} activeOpacity={0.8}>
      <View
        style={[
          styles.wrapper,
          isMe ? styles.mine : styles.theirs,
          { marginBottom: isLastInGroup ? 12 : 6 },
        ]}
      >
        <View style={[styles.bubble, bubbleShape, { backgroundColor: isMe ? colors.primary : colors.surface }]}>
          <LinkifiedText
            style={[styles.text, { color: isMe ? colors.onPrimary : colors.text }]}
            linkStyle={{ color: isMe ? colors.linkOnPrimary : colors.linkOnBubble }}
          >
            {message.message}
          </LinkifiedText>
        </View>
        <View style={[styles.metaRow, isMe ? styles.metaRowMe : styles.metaRowThem]}>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{message.timestamp}</Text>
          {isMe && <MessageStatusTicks status={message.status} />}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '75%',
  },
  mine: {
    alignSelf: 'flex-end',
  },
  theirs: {
    alignSelf: 'flex-start',
  },
  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  metaRowMe: {
    justifyContent: 'flex-end',
    paddingRight: 4,
  },
  metaRowThem: {
    justifyContent: 'flex-start',
    paddingLeft: 4,
  },
  timestamp: {
    fontSize: 12,
  },
});
