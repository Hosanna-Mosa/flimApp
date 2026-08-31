import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { ContentFilter, filterPostsByType } from '@/constants/contentFilters';
import { UserPost, UserStats } from '@/types';

const EMPTY_STATS: UserStats = { followersCount: 0, followingCount: 0, postsCount: 0 };

/**
 * Own-profile tab logic: loads stats + posts for the signed-in user,
 * re-fetches on every focus (e.g. after editing the profile), pull-to-
 * refresh, and the content-type filter over the post grid.
 */
export function useMyProfile() {
  const { user, token, refreshUser } = useAuth();
  const userId: string | undefined = (user as any)?._id || user?.id;

  const [posts, setPosts] = useState<UserPost[]>([]);
  const [stats, setStats] = useState<UserStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ContentFilter>('all');

  const loadUserData = useCallback(
    async (showLoading = true) => {
      if (!userId || !token) return;
      try {
        if (showLoading) setLoading(true);

        const [userData, postsData] = await Promise.all([
          api.user(userId, token).catch(() => null),
          api.getUserFeed(userId, 0, 100, token).catch(() => ({ data: [] })),
        ]);

        const userInfo = userData as any;
        let postsArray: UserPost[] = [];
        if (Array.isArray(postsData)) {
          postsArray = postsData;
        } else if (postsData && Array.isArray((postsData as any).data)) {
          postsArray = (postsData as any).data;
        }
        setPosts(postsArray);

        if (userInfo?.stats) {
          setStats(userInfo.stats);
        } else {
          // No stats from the API: fall back to the post count we just fetched
          setStats((prev) => ({ ...prev, postsCount: postsArray.length }));
        }
      } catch (error) {
        console.error('[Profile] Error loading profile data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [userId, token]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUserData(false), refreshUser()]);
    setRefreshing(false);
  }, [loadUserData, refreshUser]);

  // Reload whenever the tab regains focus so edits and status changes show up.
  useFocusEffect(
    useCallback(() => {
      loadUserData();
      refreshUser();
    }, [loadUserData, refreshUser])
  );

  const filteredPosts = filterPostsByType(posts, selectedFilter);

  return {
    user,
    userId,
    loading,
    refreshing,
    onRefresh,
    posts,
    /** Stats for display; posts falls back to the fetched list length. */
    stats: {
      postsCount: stats.postsCount || posts.length,
      followersCount: stats.followersCount || 0,
      followingCount: stats.followingCount || 0,
    } as UserStats,
    selectedFilter,
    setSelectedFilter,
    filteredPosts,
  };
}
