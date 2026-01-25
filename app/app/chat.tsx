import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Send, ChevronLeft, Check, CheckCheck } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '@/contexts/SocketContext';
import { apiConversation, apiDeleteMessage, apiGetUser } from '@/utils/api';
import { getAvatarUrl } from '@/utils/avatar';

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{
    userId: string;
    name: string;
  }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const { socket } = useSocket();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [userAvatar, setUserAvatar] = useState<string>('');
  const [userName, setUserName] = useState<string>(name || 'Chat');

  // Fetch user data for avatar
  useEffect(() => {
    if (userId && token) {
      const loadUserData = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const userData: any = await apiGetUser(userId, token);
          if (userData) {
            setUserAvatar(userData.avatar || '');
            if (userData.name) {
              setUserName(userData.name);
            }
          }
        } catch (e) {
          console.error('[Chat] Error loading user data:', e);
        }
      };
      loadUserData();
    }
  }, [userId, token]);

  // 1. Fetch History & Mark Read
  useEffect(() => {
    if (userId && token) {
      const loadMessages = async () => {
        try {
          console.log('[CHAT] Loading messages for userId:', userId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const response: any = await apiConversation(userId, token);
          console.log('[CHAT] API Response:', response);
          
          // Handle both wrapped and unwrapped responses
          let history: any[] = [];
          if (response && response.success && Array.isArray(response.data)) {
            history = response.data;
          } else if (Array.isArray(response)) {
            history = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            history = response.data;
          }
          
          console.log('[CHAT] Extracted messages:', history.length);
          
          if (history.length > 0) {
            const formatted = history.map((msg: any) => {
              const sender = (msg.sender && typeof msg.sender === 'object') ? msg.sender._id : msg.sender;
              return {
                id: msg._id,
                senderId: sender,
                message: msg.content,
                timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                status: msg.status || 'sent', // Default to sent if missing
              };
            });
            console.log('[CHAT] Formatted', formatted.length, 'messages');
            setMessages(formatted);
          } else {
            console.log('[CHAT] No messages found');
            setMessages([]);
          }
        } catch (e) {
          console.error('[Chat] Error loading history:', e);
          setMessages([]);
        }
      };

      const markRead = async () => {
        try {
          const api = require('@/utils/api').default; // Dynamic require to avoid cycles if any
          await api.markConversationRead(userId, token);
          // We should also refresh the global badge
          // But MessageContext polls, so it should update automatically in 5s
          // OR we can emit a socket event if we wanted instant update
        } catch (e) {
          console.error('[Chat] Error marking read:', e);
        }
      };

      loadMessages();
      markRead();
    }
  }, [userId, token]);

  // 2. Socket Listeners
  useEffect(() => {
    console.log('[CHAT] Screen opened');
    console.log('[CHAT] Socket connected:', socket?.connected);
    console.log('[CHAT] Socket ID:', socket?.id);

    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sender = (message.sender && typeof message.sender === 'object') ? message.sender._id : (message.sender || message.senderId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recipient = (message.recipient && typeof message.recipient === 'object') ? message.recipient._id : (message.recipient || message.recipientId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const currentUserId = user?.id || (user as any)?._id;

      if (sender === userId || recipient === userId || sender === currentUserId || recipient === currentUserId) {
        setMessages((prev) => [...prev, {
          id: message._id || message.id || Date.now().toString(),
          senderId: sender,
          message: message.content,
          timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'delivered', // Incoming is implicitly delivered/read
        }]);
      }
    };

    // Listen for status updates (e.g. "delivered" or "read")
    const handleStatusUpdate = (payload: any) => {
      const { messageId, status, userId: peerId } = payload;

      setMessages((prev) => prev.map((msg) => {
        // Case A: Single message update
        if (messageId && msg.id === messageId) {
          return { ...msg, status: status };
        }
        // Case B: "Read" event for the whole conversation (or by user)
        // If the update says "read", and meant for me, mark all my messages as read?
        // Actually the payload sends `userId` as the person who READ the message.
        // So if peerId == currentChatUserId, mark all MY messages as read.
        if (status === 'read' && !messageId) {
          // Mark all my messages as read
          return { ...msg, status: 'read' };
        }
        return msg;
      }));
    };

    const handleMessageSent = (message: any) => {
      console.log('[CHAT] message_sent received:', message);
      setMessages((prev) => {
        // Remove optimistic message if exists (by content match or temp ID)
        const filtered = prev.filter(m => !m.id.startsWith('temp-') || m.message !== message.content);
        
        const exists = filtered.some(m => m.id === (message._id || message.id));
        if (exists) {
          console.log('[CHAT] Message already exists, skipping');
          return filtered;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sender = (message.sender && typeof message.sender === 'object') ? message.sender._id : (message.sender || message.senderId);

        const newMessage = {
          id: message._id || message.id || Date.now().toString(),
          senderId: sender,
          message: message.content,
          timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: message.status || 'sent',
        };

        console.log('[CHAT] Adding new message to state:', newMessage);
        return [...filtered, newMessage];
      });
      
      // Scroll to bottom after adding message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_status_update', handleStatusUpdate);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_status_update', handleStatusUpdate);
    };
  }, [socket, userId, user]);

  // Ensure socket is connected on mount
  // useEffect(() => {
  //   if (socket && !socket.connected) {
  //     console.log('[CHAT] Socket not connected on mount, calling connect()');
  //     // socket.connect(); 
  //   }
  // }, [socket]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    if (!socket) {
      console.error('[CHAT] No socket instance available');
      return;
    }

    if (!socket.connected) {
      console.log('[CHAT] Socket not connected. Cannot send.');
      Alert.alert('Connection Error', 'Socket not connected. Please wait a moment and try again.');
      return;
    }

    const content = inputMessage.trim();
    const payload = {
      to: userId,
      content: content,
    };

    console.log('[SEND] Button clicked');
    console.log('[SEND] Payload:', payload);
    console.log('[SEND] Socket connected:', socket.connected);
    console.log('[SEND] Current messages count:', messages.length);

    // Clear input immediately for better UX
    setInputMessage('');

    // Emit message
    socket.emit('send_message', payload);
    console.log('[SEND] socket.emit(send_message) called');
    
    // Add optimistic message immediately (will be replaced by message_sent event)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentUserId = user?.id || (user as any)?._id;
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      message: content,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'sent',
    };
    
    setMessages((prev) => [...prev, optimisticMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleDeleteMessage = (messageId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!token) return;
            await apiDeleteMessage(messageId, token);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (error) {
            console.error('Failed to delete message:', error);
            Alert.alert('Error', 'Failed to delete message');
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerContent}
            onPress={() => {
              if (userId) {
                router.push({
                  pathname: '/user/[id]',
                  params: { id: userId }
                });
              }
            }}
            activeOpacity={0.7}
          >
            <Image
              source={{ 
                uri: getAvatarUrl(userAvatar, userId, userName, 40)
              }}
              style={styles.headerAvatar}
              contentFit="cover"
            />
            <Text style={[styles.headerTitle, { color: colors.text }]}>{userName}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 + insets.top : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item: message }) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const currentUserId = user?.id || (user as any)?._id;
            // Fallback: If sender is NOT the peer (userId), then it is me.
            const isMe = String(message.senderId) !== String(userId);

            return (
              <TouchableOpacity
                key={message.id}
                onLongPress={() => isMe && handleDeleteMessage(message.id)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.messageBubble,
                    isMe ? styles.myMessage : styles.theirMessage,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      {
                        backgroundColor: isMe ? colors.primary : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isMe ? '#000000' : colors.text },
                      ]}
                    >
                      {message.message}
                    </Text>
                    <Text
                      style={[
                        styles.timestamp,
                        {
                          color: isMe ? 'rgba(0,0,0,0.6)' : colors.textSecondary,
                        },
                      ]}
                    >
                      {message.timestamp}
                    </Text>
                    {/* Ticks for MY messages */}
                    {isMe && (
                      <View style={styles.tickContainer}>
                        {(message.status === 'sent' || !message.status) && (
                          <Check size={14} color="rgba(0,0,0,0.6)" />
                        )}
                        {message.status === 'delivered' && (
                          <CheckCheck size={14} color="rgba(0,0,0,0.6)" />
                        )}
                        {message.status === 'read' && (
                          <CheckCheck size={14} color="#007AFF" />
                        )}
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Send size={20} color="#000000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
    justifyContent: 'flex-end', // Keeps messages at bottom if few
  },
  messageBubble: {
    maxWidth: '75%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginRight: 4,
  },
  tickContainer: {
    marginLeft: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
