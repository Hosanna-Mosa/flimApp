import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Download, X } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useTheme } from '@/contexts/ThemeContext';
import { formatTime } from '@/utils/date';
import Avatar from '@/components/ui/Avatar';
import LinkifiedText from './LinkifiedText';

export interface GroupChatMessage {
  _id: string;
  type?: string;
  content?: string;
  media?: { url: string; thumbnail?: string; size?: number; width?: number; height?: number }[];
  author?: { _id?: string; name?: string; avatar?: string };
  poll?: { options: { text: string; votes: string[] }[]; userVotedOption?: number };
  createdAt?: string;
}

interface GroupMessageBubbleProps {
  message: GroupChatMessage;
  isMe: boolean;
  onVote?: (optionIndex: number) => void;
  onLongPress?: (message: GroupChatMessage) => void;
}

const formatBytes = (bytes: number = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Text on the gold `primary` bubble is white here (unlike the black-on-gold
// buttons elsewhere), so the literal is intentional.
const ON_BUBBLE = '#FFFFFF';

/**
 * One group-chat post: text, WhatsApp-style download-to-view image (with a
 * fullscreen viewer), or poll with tappable options. Announcements render as
 * a centred system line.
 */
export default function GroupMessageBubble({ message, isMe, onVote, onLongPress }: GroupMessageBubbleProps) {
  const { colors } = useTheme();
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isSystem = message.type === 'announcement';

  const media = message.media?.[0];
  const fileExtension = media?.url ? (media.url.split('.').pop() || 'jpg').split('?')[0] : 'jpg';
  // Stable cache path for the downloaded file
  const fileUri = (FileSystem.cacheDirectory || '') + `image_${message._id}.${fileExtension}`;

  useEffect(() => {
    if (message.type === 'image' && media) {
      // Check if file already exists locally
      FileSystem.getInfoAsync(fileUri)
        .then((info) => {
          if (info.exists) setDownloaded(true);
        })
        .catch(() => {});
    }
  }, [message._id, message.type, media, fileUri]);

  if (isSystem) {
    return (
      <View style={styles.systemMessage}>
        <Text style={[styles.systemText, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
          {message.content}
        </Text>
      </View>
    );
  }

  const handleDownload = async () => {
    if (!media || downloading) return;
    try {
      setDownloading(true);

      // 1. Request Permissions (Write Only)
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        alert('Permission needed to save images!');
        setDownloading(false);
        return;
      }

      // 2. Download File
      const { uri } = await FileSystem.downloadAsync(media.url, fileUri);

      // 3. Save to Gallery
      await MediaLibrary.createAssetAsync(uri);

      setDownloaded(true);
    } catch {
      alert('Failed to download image');
    } finally {
      setDownloading(false);
    }
  };

  const handleImagePress = () => {
    if (downloaded || isMe) {
      setModalVisible(true);
    }
  };

  const textColor = isMe ? ON_BUBBLE : colors.text;

  return (
    <>
      <View style={[styles.bubbleContainer, isMe ? styles.rightContainer : styles.leftContainer]}>
        {!isMe && (
          <Avatar
            uri={message.author?.avatar}
            userId={message.author?._id}
            name={message.author?.name}
            size={28}
            style={styles.avatar}
          />
        )}
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => onLongPress && onLongPress(message)}
          delayLongPress={500}
          style={[
            styles.bubble,
            { backgroundColor: isMe ? colors.primary : colors.card },
            isMe ? styles.rightBubble : styles.leftBubble,
          ]}
        >
          {!isMe && <Text style={[styles.authorName, { color: colors.primary }]}>{message.author?.name}</Text>}

          {message.type === 'image' && media && (
            <View style={styles.mediaWrapper}>
              {!downloaded && !isMe ? (
                <View style={styles.downloadContainer}>
                  <Image
                    source={{ uri: media.thumbnail || media.url }}
                    style={[styles.messageImage, { opacity: 0.3 }]}
                    blurRadius={15}
                    contentFit="cover"
                  />
                  <View style={styles.downloadOverlay}>
                    <TouchableOpacity style={styles.downloadButton} onPress={handleDownload} disabled={downloading}>
                      {downloading ? (
                        <ActivityIndicator size="small" color={ON_BUBBLE} style={{ marginRight: 6 }} />
                      ) : (
                        <Download size={20} color={ON_BUBBLE} />
                      )}
                      <Text style={styles.downloadText}>{downloading ? 'Loading...' : formatBytes(media.size)}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity onPress={handleImagePress}>
                  <Image
                    source={{ uri: isMe ? media.url : fileUri }}
                    style={styles.messageImage}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}

          {message.content ? (
            <LinkifiedText
              style={[styles.messageText, { color: textColor }]}
              linkStyle={{ color: isMe ? colors.linkOnPrimary : colors.linkOnBubble }}
            >
              {message.content}
            </LinkifiedText>
          ) : null}

          {message.type === 'poll' && (
            <View style={styles.pollContainer}>
              <Text style={[styles.pollTitle, { color: textColor }]}>📊 Poll</Text>
              {message.poll?.options.map((opt, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.pollOption,
                    { borderColor: isMe ? 'rgba(255,255,255,0.3)' : colors.border },
                    message.poll?.userVotedOption === idx && {
                      backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.primary + '20',
                    },
                  ]}
                  onPress={() => onVote && onVote(idx)}
                >
                  <Text style={[styles.pollOptionText, { color: textColor }]}>
                    {opt.text} ({opt.votes.length})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[styles.timestamp, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
            {message.createdAt ? formatTime(message.createdAt) : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen viewer */}
      <Modal visible={modalVisible} transparent onRequestClose={() => setModalVisible(false)} animationType="fade">
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <X color={ON_BUBBLE} size={32} />
          </TouchableOpacity>
          <Image source={{ uri: isMe ? media?.url : fileUri }} style={styles.fullscreenImage} contentFit="contain" />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    overflow: 'hidden',
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    marginHorizontal: 12,
    alignItems: 'flex-end',
  },
  leftContainer: {
    justifyContent: 'flex-start',
  },
  rightContainer: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginRight: 8,
    marginBottom: 2,
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '75%',
    minWidth: 80,
  },
  leftBubble: {
    borderBottomLeftRadius: 4,
  },
  rightBubble: {
    borderBottomRightRadius: 4,
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  pollContainer: {
    marginTop: 4,
    minWidth: 150,
  },
  pollTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  pollOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  pollOptionText: {
    fontSize: 12,
  },
  mediaWrapper: {
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  downloadContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  downloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  downloadButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  downloadText: {
    color: ON_BUBBLE,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 20,
    padding: 10,
  },
});
