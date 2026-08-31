import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { mapApiPostToPost } from '@/utils/mappers';
import { Post } from '@/types';
import type { FollowState } from '@/hooks/useFollow';

const PAGE_SIZE = 50;

interface UseFeedOptions {
  /**
   * Follow state to keep in sync with the feed: the following list is
   * (re)loaded alongside the feed, and authors flagged `isFollowing` on
   * feed posts are merged into it.
   */
  follow?: Pick<FollowState, 'fetchFollowingList' | 'addFollowing'>;
}

/**
 * Home feed data: paginated posts, initial / focus / pull-to-refresh
 * loading, and the legacy endpoint fallback. Pair with usePostActions for
 * like / save / share handlers.
 */
export function useFeed({ follow }: UseFeedOptions = {}) {
  const { user, token, isLoading: authLoading, blockedUsers } = useAuth();
  const fetchFollowingList = follow?.fetchFollowingList;
  const addFollowing = follow?.addFollowing;

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadFeed = useCallback(
    async (pageNumber = 0, append = false) => {
      if (!token) return;

      try {
        // Use 'latest' to show all posts, and a large limit for a fuller initial load
        const result = (await api.getFeed(pageNumber, PAGE_SIZE, 'latest', 36500, token)) as any;

        let feedItems = [];
        if (Array.isArray(result)) {
          feedItems = result;
        } else if (result && Array.isArray(result.data)) {
          feedItems = result.data;
        } else if (result && result.data && Array.isArray(result.data.data)) {
          feedItems = result.data.data;
        }

        if (feedItems.length > 0) {
          const mappedPosts = feedItems
            .map((p: any) => mapApiPostToPost(p))
            .filter((p: Post) => !blockedUsers.includes(p.userId));

          // hasMore should depend on the raw response from API, not the filtered results
          setHasMore(feedItems.length >= PAGE_SIZE);

          // Update followingIds from feed items to ensure consistency
          addFollowing?.(mappedPosts.filter((p: Post) => p.user.isFollowing).map((p: Post) => p.user.id));

          if (append) {
            setPosts((prev) => [...prev, ...mappedPosts]);
          } else {
            setPosts(mappedPosts);
          }
        } else {
          if (!append) setPosts([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('[Home] Error loading feed:', error);
        // Legacy fallback...
        if (!append) {
          try {
            const legacyResult = (await api.feed(token)) as any;
            const legacyItems = Array.isArray(legacyResult) ? legacyResult : legacyResult.data || [];
            if (legacyItems.length > 0) {
              const mappedPosts = legacyItems
                .map((p: any) => mapApiPostToPost(p))
                .filter((p: Post) => !blockedUsers.includes(p.userId));
              setPosts(mappedPosts);
              setHasMore(false);
              return;
            }
          } catch {
            // fall through to the alert
          }
        }
        Alert.alert('Error', 'Failed to load feed');
      }
    },
    [token, blockedUsers, addFollowing]
  );

  const loadEverything = useCallback(
    (label: string) =>
      Promise.all([
        fetchFollowingList
          ? fetchFollowingList().catch((e) => console.error(`[Home] ${label} following error:`, e))
          : Promise.resolve(),
        loadFeed(0, false).catch((e) => console.error(`[Home] ${label} feed error:`, e)),
      ]),
    [fetchFollowingList, loadFeed]
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await loadEverything('loadData');
    } catch (error) {
      console.error('[Home] loadData error:', error);
    } finally {
      setLoading(false);
    }
  }, [loadEverything]);

  // Refresh data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (token && !authLoading) {
        fetchFollowingList?.();
        loadFeed(0, false);
      }
    }, [token, authLoading, fetchFollowingList, loadFeed])
  );

  // Initial load once auth has resolved
  useEffect(() => {
    if (!authLoading) {
      if (token && user) {
        loadData();
      } else {
        // If not logged in, ensure we don't stay in loading state
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, authLoading, user]);

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setPage(0);
      setHasMore(true);
      await loadEverything('onRefresh');
    } catch (error) {
      console.error('[Home] onRefresh error:', error);
    } finally {
      setRefreshing(false);
    }
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

  return {
    posts,
    setPosts,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    page,
    /** Initial full-screen skeleton (first page still loading). */
    showSkeleton: loading && page === 0,
    onRefresh,
    loadMore,
  };
}
