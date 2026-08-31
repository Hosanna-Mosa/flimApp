import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostActions } from '@/hooks/usePostActions';
import { mapApiPostToPost } from '@/utils/mappers';
import { Post } from '@/types';

const PAGE_SIZE = 20;

/**
 * Saved-posts list: paginated load, pull-to-refresh, and post actions.
 * On this screen "unsave" removes the post from the list.
 */
export function useSavedPosts() {
  const { token } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchSavedPosts = useCallback(
    async (pageNumber = 0, append = false) => {
      if (!token) return;

      try {
        if (!append) setLoading(true);
        else setLoadingMore(true);

        const result = (await api.getSavedPosts(pageNumber, PAGE_SIZE, token)) as any;
        const newPosts = (result.data || []).map((p: any) => mapApiPostToPost(p, { isSaved: true }));

        if (append) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        setHasMore(newPosts.length === PAGE_SIZE);
      } catch {
        Alert.alert('Error', 'Failed to load saved posts');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [token]
  );

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

  const { handleLike, handleShare, handleComment } = usePostActions(posts, setPosts);

  const handleUnsave = async (postId: string) => {
    if (!token) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.toggleSavePost(postId, token);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {
      Alert.alert('Error', 'Failed to update saved post');
    }
  };

  return {
    posts,
    loading,
    refreshing,
    loadingMore,
    /** Initial full-screen skeleton (first page still loading). */
    showSkeleton: loading && page === 0,
    onRefresh,
    loadMore,
    handleLike,
    handleShare,
    handleComment,
    handleUnsave,
  };
}
