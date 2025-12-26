import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, Modal } from 'react-native';
import { Image } from 'expo-image';
import { Send as SendIcon, Plus, Download, Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export const formatChatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatBytes = (bytes: number = 0) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export const MessageBubble = ({ message, isMe, onVote, onLongPress }: any) => {
  const { colors } = useTheme();
  const [downloaded, setDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const isSystem = message.type === 'announcement';

  const media = message.media?.[0];
  const fileExtension = media?.url ? media.url.split('.').pop().split('?')[0] : 'jpg';
  // Use a stable path for the file in cache
  const fileUri = (FileSystem.cacheDirectory || '') + `image_${message._id}.${fileExtension}`;

  useEffect(() => {
    if (message.type === 'image' && media) {
      // Check if file already exists locally
      FileSystem.getInfoAsync(fileUri).then(info => {
        if (info.exists) setDownloaded(true);
      }).catch(err => console.log('File check error:', err));
    }
  }, [message._id, fileUri]);

  if (isSystem) {
    return (
      <View style={styles.systemMessage}>
        <Text style={[styles.systemText, { color: colors.textSecondary }]}>
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
    } catch (e) {
      console.error(e);
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

  return (
    <>
      <View style={[
        styles.bubbleContainer, 
        isMe ? styles.rightContainer : styles.leftContainer
      ]}>
        {!isMe && (
          <Image 
            source={{ uri: message.author?.avatar || 'https://via.placeholder.com/30' }} 
            style={styles.avatar}
          />
        )}
        <TouchableOpacity 
          activeOpacity={0.9}
          onLongPress={() => onLongPress && onLongPress(message)}
          delayLongPress={500}
          style={[
            styles.bubble, 
            isMe ? { backgroundColor: colors.primary } : { backgroundColor: colors.card },
            isMe ? styles.rightBubble : styles.leftBubble
          ]}
        >
          {!isMe && (
            <Text style={[styles.authorName, { color: colors.primary }]}>
              {message.author?.name}
            </Text>
          )}
          
          {/* WhatsApp-style Image Download */}
          {message.type === 'image' && media && (
            <View style={styles.mediaWrapper}>
              {(!downloaded && !isMe) ? (
                <View style={styles.downloadContainer}>
                  <Image
                    source={{ uri: media.thumbnail || media.url }}
                    style={[styles.messageImage, { opacity: 0.3 }]}
                    blurRadius={15}
                    contentFit="cover"
                  />
                  <View style={styles.downloadOverlay}>
                    <TouchableOpacity 
                      style={styles.downloadButton}
                      onPress={handleDownload}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 6 }} />
                      ) : (
                        <Download size={20} color="#fff" />
                      )}
                      <Text style={styles.downloadText}>
                        {downloading ? 'Loading...' : formatBytes(media.size)}
                      </Text>
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
            <Text style={[
              styles.messageText, 
              { color: isMe ? '#fff' : colors.text }
            ]}>
              {message.content}
            </Text>
          ) : null}
          
          {/* Simple Poll Placeholder */}
          {message.type === 'poll' && (
            <View style={styles.pollContainer}>
              <Text style={{color: isMe ? '#fff' : colors.text, fontWeight: 'bold', marginBottom: 4}}>📊 Poll</Text>
              {message.poll?.options.map((opt: any, idx: number) => (
                  <TouchableOpacity 
                    key={idx} 
                    style={[
                      styles.pollOption, 
                      { borderColor: isMe ? 'rgba(255,255,255,0.3)' : colors.border },
                      message.poll.userVotedOption === idx && { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : colors.primary + '20' }
                    ]}
                    onPress={() => onVote && onVote(idx)}
                  >
                    <Text style={{color: isMe ? '#fff' : colors.text, fontSize: 12}}>{opt.text} ({opt.votes})</Text>
                  </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={[
            styles.timestamp, 
            { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {formatChatTime(message.createdAt)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Fullscreen Modal */}
      <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)} animationType="fade">
        <View style={styles.fullscreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <X color="#fff" size={32} />
          </TouchableOpacity>
          <Image 
            source={{ uri: isMe ? media?.url : fileUri }} 
            style={styles.fullscreenImage} 
            contentFit="contain" 
          />
        </View>
      </Modal>
    </>
  );
};

export const ChatInput = ({ onSend, loading, disabled, onAttachment }: any) => {
  const { colors } = useTheme();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <TouchableOpacity 
        style={styles.attachButton} 
        disabled={disabled}
        onPress={onAttachment}
      >
        <Plus size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      
      <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Message..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={text}
          onChangeText={setText}
          editable={!disabled && !loading}
        />
      </View>

      <TouchableOpacity 
        style={[styles.sendButton, { backgroundColor: text.trim() ? colors.primary : colors.border }]} 
        onPress={handleSend}
        disabled={!text.trim() || disabled || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <SendIcon size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  systemMessage: {
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 20
  },
  systemText: {
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 10,
    overflow: 'hidden'
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
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 2
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
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
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
    minWidth: 150
  },
  pollOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 4
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10, // simple safe area approximation
  },
  attachButton: {
    padding: 10,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginHorizontal: 8,
    paddingVertical: 8,
  },
  input: {
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaWrapper: {
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative'
  },
  downloadContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    borderRadius: 8
  },
  downloadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  downloadButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  downloadText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '600'
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
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
    padding: 10
  }
});
