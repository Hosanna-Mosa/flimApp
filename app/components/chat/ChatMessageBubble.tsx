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

export interface DirectMessageReply {
  messageId?: string;
  senderName?: string;
  preview?: string;
  mediaType?: 'image' | 'video';
}

export interface DirectMessage {
  id: string;
  senderId: string;
  message: string;
  media?: DirectMessageMedia;
  replyTo?: DirectMessageReply;
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

  /**
   * Portrait photos are allowed to be tall, but only so far — an 9:16 phone
   * shot would otherwise fill the entire conversation and push everything else
   * off screen. Landscape is left alone.
   */
  const rawAspect =
    message.media?.width && message.media?.height
      ? message.media.width / message.media.height
      : 1;
  const aspect = Math.max(rawAspect, 0.72);

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
            // A bare photo fills the bubble edge to edge. Any padding here
            // reads as a coloured frame around the image rather than as a
            // bubble, and the theme gold makes that especially loud.
            message.media
              ? message.message || message.replyTo?.senderName
                ? styles.bubbleWithCaption
                : styles.bubbleMediaOnly
              : null,
          ]}
        >
          {message.replyTo?.senderName && (
            <View
              style={[
                styles.quote,
                {
                  backgroundColor: isMe ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.05)',
                  borderLeftColor: isMe ? colors.onPrimary : colors.primary,
                },
              ]}
            >
              <Text
                style={[styles.quoteName, { color: isMe ? colors.onPrimary : colors.primary }]}
                numberOfLines={1}
              >
                {message.replyTo.senderName}
              </Text>
              <Text
                style={[styles.quoteText, { color: isMe ? colors.onPrimary : colors.textSecondary }]}
                numberOfLines={2}
              >
                {message.replyTo.preview ||
                  (message.replyTo.mediaType === 'video' ? 'Video' : 'Photo')}
              </Text>
            </View>
          )}

          {message.media && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onPressMedia?.(message.media as DirectMessageMedia)}
              disabled={message.uploading}
            >
              <View>
                <Image
                  source={{ uri: message.media.thumbnail || message.media.url }}
                  style={[
                    styles.media,
                    // Keep the sender's framing. A fixed square crops tall
                    // photos through the middle, which is where faces are.
                    { aspectRatio: aspect },
                    message.message ? styles.mediaWithCaption : null,
                    message.uploading && styles.mediaUploading,
                  ]}
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
  bubbleMediaOnly: {
    padding: 0,
  },
  bubbleWithCaption: {
    padding: 3,
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginBottom: 6,
    marginHorizontal: 2,
  },
  quoteName: { fontSize: 13, fontWeight: '700', marginBottom: 1 },
  quoteText: { fontSize: 13, lineHeight: 17, opacity: 0.85 },
  media: {
    width: 250,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  /** Rounded only when a caption follows, so the two read as one card. */
  mediaWithCaption: {
    borderRadius: 15,
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
