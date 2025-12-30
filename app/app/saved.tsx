import React, { useState, useEffect, useCallback } from 'react';
import { FeedSkeleton } from '@/components/skeletons/FeedSkeleton';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { Post } from '@/types';
import FeedPost from '@/components/FeedPost';

export default function SavedPostsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSavedPosts = useCallback(async (pageNumber = 0, append = false) => {
    if (!token) return;

    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      const result = await api.getSavedPosts(pageNumber, 20, token) as any;
      const newPosts = (result.data || []).map((p: any) => ({
        ...p,
        id: p._id || p.id,
        user: {
          id: p.author?._id || p.author?.id || p.userId,
          name: p.author?.name || 'Unknown User',
          avatar: p.author?.avatar || 'https://via.placeholder.com/150',
          isVerified: p.author?.isVerified || false,
          roles: p.author?.roles || [],
          isFollowing: p.author?.isFollowing || false,
        },
        likes: p.engagement?.likesCount || p.likes || 0,
        comments: p.engagement?.commentsCount || p.comments || 0,
        shares: p.engagement?.sharesCount || p.shares || 0,
        isSaved: true,
      }));

      if (append) {
        setPosts(prev => [...prev, ...newPosts]);
      } else {
        setPosts(newPosts);
      }

      setHasMore(newPosts.length === 20);
    } catch (error) {
      // console.error('[SavedPosts] Error fetching:', error);
      Alert.alert('Error', 'Failed to load saved posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchSavedPosts(0, false);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSavedPosts(nextPage, true);
    }
  };

  const handleLike = async (postId: string) => {
    // Basic like implementation similar to Home
    // For simplicity, we just toggle local state here
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 } : p
    ));
    // Actually call API if needed, but usually users just want to see saved stuff
  };

  const handleSave = async (postId: string) => {
    if (!token) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // In Saved screen, "unsaving" should remove the post from the list
      await api.toggleSavePost(postId, token);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      Alert.alert('Error', 'Failed to update saved post');
    }
  };

  const handleShare = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const shareUrl = `https://filmy.app/post/${postId}`;
    await Share.share({ message: post.caption ? `${post.caption}\n\n${shareUrl}` : shareUrl });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Saved Posts',
          headerTitleStyle: { fontWeight: 'bold' },
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ChevronLeft size={28} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      {loading && page === 0 ? (
        <View style={{ flex: 1, paddingTop: 10 }}>
           {[1, 2, 3].map(i => <FeedSkeleton key={i} />)}
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No saved posts yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FeedPost
              post={item}
              isFollowing={true} // Usually safe to assume or skip follow logic in saved
              onFollow={() => {}}
              onLike={handleLike}
              onComment={(id) => router.push(`/post/${id}`)}
              onShare={handleShare}
              onSave={handleSave}
              primaryColor={colors.primary}
              borderColor={colors.border}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
