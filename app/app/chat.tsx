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
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSocket } from '@/contexts/SocketContext';
import { apiConversation, apiDeleteMessage } from '@/utils/api';

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

  // 1. Fetch History
  // 1. Fetch History & Mark Read
  useEffect(() => {
    if (userId && token) {
      const loadMessages = async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const history: any = await apiConversation(userId, token);
          if (Array.isArray(history)) {
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
            setMessages(formatted);
          }
        } catch (e) {
          console.error('[Chat] Error loading history:', e);
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
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      console.log('[Chat] Received message:', message);
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
            minute: '2-digit',
          }),
          status: 'delivered', // Incoming is implicitly delivered/read
        }]);
      }
    };

    // Listen for status updates (e.g. "delivered" or "read")
    const handleStatusUpdate = (payload: any) => {
      console.log('[Chat] handleStatusUpdate:', payload);
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
      console.log('[Chat] Message sent confirmed:', message);
      setMessages((prev) => {
        const exists = prev.some(m => m.id === (message._id || message.id));
        if (exists) return prev;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sender = (message.sender && typeof message.sender === 'object') ? message.sender._id : (message.sender || message.senderId);

        return [...prev, {
          id: message._id || message.id || Date.now().toString(),
          senderId: sender,
          message: message.content,
          timestamp: new Date(message.createdAt || Date.now()).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          status: 'sent',
        }];
      });
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

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    const content = inputMessage.trim();

    socket.emit('send_message', {
      to: userId,
      content: content,
    });

    setInputMessage('');
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
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{name || 'Chat'}</Text>
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
            const isMe = String(message.senderId) === String(currentUserId);
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
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
