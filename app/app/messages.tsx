import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatItem {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

const mockChats: ChatItem[] = [
  {
    id: '1',
    user: {
      id: '1',
      name: 'Raj Malhotra',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=raj',
      isOnline: true,
    },
    lastMessage: 'Looking forward to working with you!',
    lastMessageTime: '2m ago',
    unreadCount: 2,
  },
  {
    id: '2',
    user: {
      id: '2',
      name: 'Priya Sharma',
      avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=priya',
      isOnline: false,
    },
    lastMessage: 'Thanks for the collaboration opportunity',
    lastMessageTime: '1h ago',
    unreadCount: 0,
  },
];

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {mockChats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push(`/chat?userId=${chat.user.id}&name=${chat.user.name}`)
            }
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: chat.user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              {chat.user.isOnline && (
                <View
                  style={[
                    styles.onlineBadge,
                    { backgroundColor: colors.success },
                  ]}
                />
              )}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {chat.user.name}
                </Text>
                <Text style={[styles.time, { color: colors.textSecondary }]}>
                  {chat.lastMessageTime}
                </Text>
              </View>
              <View style={styles.messageRow}>
                <Text
                  style={[
                    styles.lastMessage,
                    {
                      color:
                        chat.unreadCount > 0
                          ? colors.text
                          : colors.textSecondary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {chat.lastMessage}
                </Text>
                {chat.unreadCount > 0 && (
                  <View
                    style={[
                      styles.unreadBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {mockChats.length === 0 && (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No messages yet
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineBadge: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    bottom: 2,
    right: 2,
    borderWidth: 2,
    borderColor: '#1F1F1F',
  },
  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  time: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#000000',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
});
