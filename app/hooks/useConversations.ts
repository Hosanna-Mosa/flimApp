import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatDateTime } from '@/utils/date';

export interface ConversationItem {
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

/**
 * Messages-screen logic: loads conversations on focus (skeleton only on the
 * very first load), debounced search that never double-fetches on mount, and
 * pull-to-refresh.
 */
export function useConversations() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ConversationItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Latest values for effects that must not re-run when these change.
  const chatsRef = useRef<ConversationItem[]>([]);
  const queryRef = useRef('');
  chatsRef.current = chats;
  queryRef.current = searchQuery;

  // `silent` refreshes in place without showing the skeleton — used when we
  // already have rows on screen (focus refresh, pull-to-refresh, typing).
  const loadChats = useCallback(
    async (query: string = '', silent: boolean = false) => {
      if (!token) return;

      try {
        if (!silent) setLoading(true);
        // Using the api wrapper handles response unwrapping
        const data: any = await api.getConversations(token, query);

        if (Array.isArray(data)) {
          const formatted: ConversationItem[] = data.map((item: any) => ({
            id: item.peer._id,
            user: {
              id: item.peer._id,
              name: item.peer.name,
              avatar: item.peer.avatar,
              isOnline: false,
              isVerified: item.peer.isVerified,
            },
            lastMessage: item.lastMessage.content,
            lastMessageTime: formatDateTime(item.lastMessage.createdAt),
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

  // Initial load + refresh whenever the screen regains focus. Only the very
  // first load shows the skeleton; later focuses update the rows in place.
  useFocusEffect(
    useCallback(() => {
      loadChats(queryRef.current, chatsRef.current.length > 0);
    }, [loadChats])
  );

  // Debounced search. Skips the mount run (the focus effect owns the initial
  // load) so the list doesn't fetch — and flash — twice.
  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadChats(searchQuery, chatsRef.current.length > 0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadChats]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChats(searchQuery, true);
    setRefreshing(false);
  };

  return { chats, loading, refreshing, searchQuery, setSearchQuery, onRefresh };
}
