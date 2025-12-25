import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetConversations } from '@/utils/api';

interface ChatItem {
  id: string; // Peer ID
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
    isVerified: boolean;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadChats = useCallback(async () => {
    if (!token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await apiGetConversations(token);
      if (Array.isArray(data)) {
        const formattedChats: ChatItem[] = data.map((item: any) => ({
          id: item.peer._id,
          user: {
            id: item.peer._id,
            name: item.peer.name,
            avatar: item.peer.avatar,
            isOnline: false, // Need socket presence for this
            isVerified: item.peer.isVerified,
          },
          lastMessage: item.lastMessage.content,
          lastMessageTime: new Date(item.lastMessage.createdAt).toLocaleString(
            'en-US',
            { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }
          ),
          unreadCount: 0, // Need readout status or count logic
        }));
        setChats(formattedChats);
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {chats.map((chat) => (
          <TouchableOpacity
            key={chat.id}
            style={[
              styles.chatItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/chat',
                params: { userId: chat.user.id, name: chat.user.name }
              })
            }
          >
            <View style={styles.avatarContainer}>
              <Image
                source={{ uri: chat.user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              {/* Online badge logic would go here */}
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {chat.user.name}
                  {chat.user.isVerified && (
                      <Text style={{ color: colors.primary }}> ✓</Text>
                  )}
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
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {chats.length === 0 && (
          <View style={styles.emptyState}>
            <MessageCircle size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No conversations yet
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
    fontWeight: '600',
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
