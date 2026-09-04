import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Play } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import MessageStatusTicks, { MessageStatus } from './MessageStatusTicks';
import LinkifiedText from './LinkifiedText';

export interface DirectMessageMedia {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export interface DirectMessage {
  id: string;
  senderId: string;
  message: string;
  media?: DirectMessageMedia;
  /** Set on the optimistic copy while its attachment uploads. */
  uploading?: boolean;
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
  onPressMedia?: (media: DirectMessageMedia) => void;
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
  onPressMedia,
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
        <View
          style={[
            styles.bubble,
            bubbleShape,
            { backgroundColor: isMe ? colors.primary : colors.surface },
            // Media sits flush to the bubble edge; padding would frame it.
            message.media ? styles.bubbleWithMedia : null,
          ]}
        >
          {message.media && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onPressMedia?.(message.media as DirectMessageMedia)}
              disabled={message.uploading}
            >
              <View>
                <Image
                  source={{ uri: message.media.thumbnail || message.media.url }}
                  style={[styles.media, message.uploading && styles.mediaUploading]}
                  contentFit="cover"
                  transition={150}
                />
                {message.media.type === 'video' && !message.uploading && (
                  <View style={styles.playBadge}>
                    <Play size={22} color="#FFFFFF" fill="#FFFFFF" />
                  </View>
                )}
                {message.uploading && (
                  <View style={styles.uploadOverlay}>
                    <ActivityIndicator color="#FFFFFF" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}

          {!!message.message && (
          <LinkifiedText
            style={[
              styles.text,
              message.media ? styles.textUnderMedia : null,
              { color: isMe ? colors.onPrimary : colors.text },
            ]}
            linkStyle={{ color: isMe ? colors.linkOnPrimary : colors.linkOnBubble }}
          >
            {message.message}
          </LinkifiedText>
          )}
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
    overflow: 'hidden',
  },
  bubbleWithMedia: {
    padding: 4,
  },
  media: {
    width: 220,
    height: 220,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  mediaUploading: {
    opacity: 0.5,
  },
  playBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  uploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    lineHeight: 20,
  },
  /**
   * Only applied alongside media. The bubble drops to 4px padding so the image
   * sits flush, which would otherwise leave the caption touching the edge.
   */
  textUnderMedia: {
    paddingHorizontal: 10,
    paddingBottom: 6,
    paddingTop: 8,
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
