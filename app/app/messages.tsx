import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import { MessageCircle, Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetConversations } from '@/utils/api';
import { getAvatarUrl } from '@/utils/avatar';
import { MessageSkeleton } from '@/components/skeletons/MessageSkeleton';

interface ChatItem {
  id: string;
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

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadChats = useCallback(
    async (query: string = '') => {
      if (!token) return;

      try {
        if (!refreshing) setLoading(true);
        let data: any = await apiGetConversations(token, query);

        if (data && data.success && Array.isArray(data.data)) {
          data = data.data;
        } else if (data && data.data && Array.isArray(data.data)) {
          data = data.data;
        }

        if (Array.isArray(data)) {
          const formatted: ChatItem[] = data.map((item: any) => ({
            id: item.peer._id,
            user: {
              id: item.peer._id,
              name: item.peer.name,
              avatar: item.peer.avatar,
              isOnline: false,
              isVerified: item.peer.isVerified,
            },
            lastMessage: item.lastMessage.content,
            lastMessageTime: new Date(
              item.lastMessage.createdAt
            ).toLocaleString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              month: 'short',
              day: 'numeric',
            }),
            unreadCount: item.unreadCount || 0,
          }));

          setChats(formatted);
        }
      } catch (err) {
        console.error('Failed to load chats:', err);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      loadChats(searchQuery);
    }, [loadChats, searchQuery])
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChats(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadChats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats(searchQuery);
    setRefreshing(false);
  };

  return (
    <>
      {/* ✅ Header handles top safe area */}
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Messages',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      {/* ✅ SafeArea WITHOUT top edge */}
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom', 'left', 'right']}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {/* Search */}
          <View style={styles.searchContainer}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search conversations..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Chats */}
          {loading ? (
             <View>
                 {[1, 2, 3, 4, 5, 6].map(i => <MessageSkeleton key={i} />)}
             </View>
          ) : chats.map((chat) => (
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
                  params: { userId: chat.user.id, name: chat.user.name },
                })
              }
            >
              <Image
                source={{
                  uri: getAvatarUrl(
                    chat.user.avatar,
                    chat.user.id,
                    chat.user.name,
                    56
                  ),
                }}
                style={styles.avatar}
                contentFit="cover"
              />

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
                    numberOfLines={1}
                    style={[
                      styles.lastMessage,
                      {
                        color:
                          chat.unreadCount > 0
                            ? colors.text
                            : colors.textSecondary,
                        fontWeight: chat.unreadCount > 0 ? '700' : '400',
                      },
                    ]}
                  >
                    {chat.lastMessage}
                  </Text>

                  {chat.unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadDot,
                        { backgroundColor: colors.primary },
                      ]}
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Empty */}
          {chats.length === 0 && (
            <View style={styles.emptyState}>
              <MessageCircle size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No conversations yet
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 24 : 16,
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
  },

  chatItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
  },

  chatInfo: {
    flex: 1,
    marginLeft: 12,
  },

  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
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
