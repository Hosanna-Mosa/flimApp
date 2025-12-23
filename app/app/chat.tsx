import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: string;
  senderId: string;
  message: string;
  timestamp: string;
}

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{
    userId: string;
    name: string;
  }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      senderId: userId || '',
      message: 'Hey! How are you doing?',
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      senderId: user?.id || '',
      message: 'Hi! I am doing great, thanks for asking!',
      timestamp: '10:32 AM',
    },
    {
      id: '3',
      senderId: userId || '',
      message: 'Looking forward to collaborating on the new project',
      timestamp: '10:35 AM',
    },
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || '',
      message: inputMessage,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages([...messages, newMessage]);
    setInputMessage('');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: name || 'Chat',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => {
            const isMe = message.senderId === user?.id;
            return (
              <View
                key={message.id}
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
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
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
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
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
});
