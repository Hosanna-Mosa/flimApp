import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import {
  MessageCircle,
  Heart,
  Share2,
  MessageSquare,
  Film,
  Play,
  Music,
  FileText,
  Flame,
  Bell,
  Plus,
  Check,
  BadgeCheck,
  Users,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMessages } from '@/contexts/MessageContext';
import FeedPost from '@/components/FeedPost';
import { FeedSkeleton } from '@/components/skeletons/FeedSkeleton';
import api from '@/utils/api';
import { Post, User } from '@/types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token, isLoading: authLoading } = useAuth();
  const { unreadCount: notificationCount } = useNotifications();
  const { unreadCount: messageCount } = useMessages();

  useEffect(() => {
    // console.log('[Home] Render messageCount:', messageCount);
  }, [messageCount]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination State
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch following list - Memoized for useFocusEffect
  const fetchFollowingList = useCallback(async () => {
    if (!user || !token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = user.id || (user as any)._id;
      if (!userId) {
        // console.error('[Home] User ID missing', user);
        return;
      }

      // Fetch a large number of following users to build the local source of truth
      const result = await api.getFollowing(userId, 0, 1000, token);

      if ((result as any).data && Array.isArray((result as any).data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawIds = (result as any).data.map((u: any) => u._id || u.id);
        const ids = new Set<string>(rawIds);
        setFollowingIds(ids);
        // console.log('[Home] Following IDs refreshed:', Array.from(ids).length);
      }
    } catch (error) {
      // console.error('[Home] Error fetching following list:', error);
    }
  }, [user, token]);

  const loadFeed = useCallback(async (pageNumber = 0, append = false) => {
    if (!token) return;

    try {
      console.log(`[Home] Loading feed page ${pageNumber}...`);
      const result = await api.getFeed(pageNumber, 20, 'hybrid', 36500, token) as any;

      // ... existing mapping logic ...
      let feedItems = [];
      if (Array.isArray(result)) {
        feedItems = result;
      } else if (result && Array.isArray(result.data)) {
        feedItems = result.data;
      } else if (result && result.data && Array.isArray(result.data.data)) {
        feedItems = result.data.data;
      }

      if (feedItems.length > 0) {
        const mappedPosts = feedItems.map((p: any) => ({
          id: p._id || p.id,
          userId: p.author?._id || p.author?.id || p.userId,
          user: {
            id: p.author?._id || p.author?.id || p.userId,
            name: p.author?.name || 'Unknown User',
            avatar: p.author?.avatar || 'https://via.placeholder.com/150',
            isVerified: p.author?.isVerified || false,
            roles: p.author?.roles || [],
            isFollowing: p.author?.isFollowing || false,
          },
          type: p.type || 'image',
          mediaUrl: p.mediaUrl || p.media?.url,
          thumbnailUrl: p.thumbnailUrl || p.media?.thumbnail,
          media: p.media,
          caption: p.caption || '',
          likes: p.engagement?.likesCount || p.likes || 0,
          comments: p.engagement?.commentsCount || p.comments || 0,
          shares: p.engagement?.sharesCount || p.shares || 0,
          isLiked: p.isLiked || false,
          createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
        }));

        setHasMore(mappedPosts.length === 20);

        if (append) {
          setPosts(prev => [...prev, ...mappedPosts]);
        } else {
          setPosts(mappedPosts);
        }
      } else {
        if (!append) setPosts([]);
        setHasMore(false);
      }
    } catch (error) {
      // Legacy fallback...
      if (!append) {
        try {
          const legacyResult = await api.feed(token) as any;
          const legacyItems = Array.isArray(legacyResult) ? legacyResult : (legacyResult.data || []);
          if (legacyItems.length > 0) {
            const mappedPosts = legacyItems.map((p: any) => ({
              id: p._id || p.id,
              userId: p.author?._id || p.author?.id || p.userId,
              user: {
                id: p.author?._id || p.author?.id || p.userId,
                name: p.author?.name || 'Unknown User',
                avatar: p.author?.avatar || 'https://via.placeholder.com/150',
                isVerified: p.author?.isVerified || false,
                roles: p.author?.roles || [],
                isFollowing: false,
              },
              type: p.type || 'image',
              mediaUrl: p.mediaUrl || p.media?.url,
              thumbnailUrl: p.thumbnailUrl || p.media?.thumbnail,
              media: p.media,
              caption: p.caption || '',
              likes: p.engagement?.likesCount || p.likes || 0,
              comments: p.engagement?.commentsCount || p.comments || 0,
              shares: p.engagement?.sharesCount || p.shares || 0,
              isLiked: p.isLiked || false,
              createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Just now',
            }));
            setPosts(mappedPosts);
            setHasMore(false);
            return;
          }
        } catch (err) { }
      }
      Alert.alert('Error', 'Failed to load feed');
    }
  }, [token]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchFollowingList(), loadFeed()]);
    setLoading(false);
  };

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFollowingList();
    }, [fetchFollowingList])
  );

  // Refresh feed when screen comes into focus (to update comment counts, etc.)
  useFocusEffect(
    useCallback(() => {
      // Only reload if we already have posts (not initial load)
      if (token) {
        // We can check if we have posts, but we shouldn't depend on posts.length
        // because it changes after loading, causing a loop.
        loadFeed(0, false);
      }
    }, [token, loadFeed])
  );

  // Load feed and following list when token changes (Initial load)
  useEffect(() => {
    if (!authLoading && token && user) {
      loadData();
    }
  }, [token, authLoading, user]);

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    setHasMore(true);
    // Reload everything
    await Promise.all([fetchFollowingList(), loadFeed(0, false)]);
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      await loadFeed(nextPage, true);
      setLoadingMore(false);
    }
  };

  const toggleFollow = async (userId: string) => {
    try {
      const isCurrentlyFollowing = followingIds.has(userId);

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update of the Set
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });

      if (isCurrentlyFollowing) {
        const result = await api.unfollowUser(userId, token || undefined) as any;
        // console.log('[Home] Unfollowed user:', result);
      } else {
        const result = await api.followUser(userId, token || undefined) as any;
        // console.log('[Home] Followed user:', result);

        if (result.status === 'pending') {
          Alert.alert('Follow Request Sent', 'This account is private. Your request is pending.');
          setFollowingIds(prev => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }
      }
    } catch (error) {
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (followingIds.has(userId)) {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
      // console.error('[Home] Follow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      // console.log('[Home] handleLike - Current user:', user ? `${user.name} (${(user as any)._id || user.id})` : 'Not logged in');

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const wasLiked = post.isLiked;

      // Optimistic update
      setPosts(prevPosts => prevPosts.map((p) =>
        p.id === postId
          ? {
            ...p,
            isLiked: !p.isLiked,
            likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          }
          : p
      ));

      // API call
      if (wasLiked) {
        const result = await api.unlikePost(postId, token || undefined) as any;
        // console.log('[Home] Unliked post:', result);

        // Update with real count from server
        setPosts(prevPosts => prevPosts.map((p) =>
          p.id === postId ? { ...p, likes: result.likesCount, isLiked: false } : p
        ));
      } else {
        const result = await api.likePost(postId, token || undefined) as any;
        // console.log('[Home] Liked post:', result);

        // Update with real count from server
        setPosts(prevPosts => prevPosts.map((p) =>
          p.id === postId ? { ...p, likes: result.likesCount, isLiked: true } : p
        ));
      }
    } catch (error) {
      setPosts(prevPosts => prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked,
            likes: p.isLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      }));
      // console.error('[Home] Like error:', error);
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;

      const shareUrl = `https://filmy.app/post/${postId}`;
      const message = post.caption ? `${post.caption}\n\n${shareUrl}` : shareUrl;

      await Share.share({
        message,
        url: shareUrl,
      });
    } catch (error) {
      // console.error('[Home] Share error:', error);
    }
  };

  const handleSave = async (postId: string) => {
    if (!token) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Find if post is already saved
      const post = posts.find(p => p.id === postId);
      const wasSaved = post?.isSaved;

      // Optimistic update
      setPosts(prevPosts => prevPosts.map((p) =>
        p.id === postId ? { ...p, isSaved: !wasSaved } : p
      ));

      // API call
      const result = await api.toggleSavePost(postId, token);

      // Sync with server response
      setPosts(prevPosts => prevPosts.map((p) =>
        p.id === postId ? { ...p, isSaved: result.saved } : p
      ));
    } catch (error) {
      // Revert on error
      setPosts(prevPosts => prevPosts.map((p) => {
        if (p.id === postId) {
          return { ...p, isSaved: !p.isSaved };
        }
        return p;
      }));
      Alert.alert('Error', 'Failed to save post');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Filmy',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, paddingRight: 16 }}>
              <TouchableOpacity
                onPress={() => router.push('/trending')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginHorizontal: 4 }}
              >
                <Flame size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginHorizontal: 4 }}
              >
                <View style={{ width: 24, height: 24 }}>
                  <Bell size={24} color={colors.text} />
                  {notificationCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#FF3B30',
                        borderRadius: 10,
                        minWidth: 18,
                        height: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                        borderWidth: 2,
                        borderColor: colors.background,
                        elevation: 5,
                        zIndex: 999,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push('/messages')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginHorizontal: 4 }}
              >
                <View style={{ width: 24, height: 24 }}>
                  <MessageCircle size={24} color={colors.text} />
                  {messageCount > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        backgroundColor: '#FF3B30',
                        borderRadius: 10,
                        minWidth: 18,
                        height: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 4,
                        borderWidth: 2,
                        borderColor: colors.background,
                        elevation: 5, // Android shadow/z-index
                        zIndex: 999,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' }}>
                        {messageCount > 99 ? '99+' : messageCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {loading && page === 0 ? (
        <View style={{ flex: 1, paddingTop: 10 }}>
          {[1, 2, 3].map((i) => (
            <FeedSkeleton key={i} />
          ))}
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            No posts yet. Follow some users to see their posts!
          </Text>
        </View>
      ) : (
        <FlatList
          style={[styles.container, { backgroundColor: colors.background }]}
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedPost
              post={item}
              isFollowing={followingIds.has(item.user.id)}
              onFollow={toggleFollow}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onSave={handleSave}
              primaryColor={colors.primary}
              borderColor={colors.border}
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ... Keep existing styles ...
  postCard: { marginBottom: 16, borderBottomWidth: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  followBadge: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  userInfo: { flex: 1, marginLeft: 12 },
  nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  userName: { fontSize: 16, fontWeight: '600' },
  roleContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  role: { fontSize: 12, textTransform: 'capitalize' },
  mediaBadge: { padding: 8, borderRadius: 8 },
  media: { width: '100%', height: 300 },
  audioContainer: { height: 200, alignItems: 'center', justifyContent: 'center', gap: 12 },
  audioText: { fontSize: 16, fontWeight: '600' },
  postContent: { padding: 16 },
  caption: { fontSize: 14, lineHeight: 20 },
  timestamp: { fontSize: 12, marginTop: 8 },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  action: { flexDirection: 'row', alignItems: 'center', marginRight: 24, gap: 6 },
  actionText: { fontSize: 14, fontWeight: '500' },
});
