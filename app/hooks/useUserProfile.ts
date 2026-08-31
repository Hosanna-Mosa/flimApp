import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFollow } from '@/hooks/useFollow';
import { ContentFilter, filterPostsByType } from '@/constants/contentFilters';
import { UserPost, UserProfile } from '@/types';

/**
 * Public-profile logic for /user/[id]: loads the profile + posts, probes
 * our follow status to decide whether a private account shows limited
 * data, follow / request toggling (via the shared useFollow) with
 * follower-count updates, block awareness, messaging and the grid filter.
 */
export function useUserProfile(id: string) {
  const router = useRouter();
  const { token, blockedUsers } = useAuth();
  const follow = useFollow();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [hasLimitedData, setHasLimitedData] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ContentFilter>('all');

  const isBlockedUser = blockedUsers.some((blockedId) => String(blockedId) === String(id));
  const isFollowing = follow.isFollowing(id);
  const isPending = follow.isPending(id);

  const { refreshFollowStatus, applyFollowStatus } = follow;

  const loadUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      const [userData, postsData] = await Promise.all([
        api.user(id, token || undefined),
        api.getUserFeed(id, 0, 100, token || undefined).catch((err) => {
          console.error('[UserProfile] api.getUserFeed error:', err);
          return { data: [] };
        }),
      ]);

      const userInfo = userData as any;
      setUser(userInfo);

      let postsArray: UserPost[] = [];
      if (Array.isArray(postsData)) {
        postsArray = postsData;
      } else if (postsData && Array.isArray((postsData as any).data)) {
        postsArray = (postsData as any).data;
      }
      setPosts(postsArray);

      const accountType = userInfo?.accountType || (userInfo?.isPrivate ? 'private' : 'public');
      setIsPrivateAccount(accountType === 'private');

      // Probe follow status first: it decides whether a private profile is limited.
      const status = await refreshFollowStatus(id);
      if (!status) applyFollowStatus(id, false, null);
      const following = status?.following ?? false;
      const statusValue = status?.status ?? null;

      // Private AND not following → limited data, even if stats were returned.
      setHasLimitedData(accountType === 'private' && !following && statusValue !== 'accepted');
    } catch {
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [id, token, refreshFollowStatus, applyFollowStatus]);

  useEffect(() => {
    if (id && token) loadUserProfile();
  }, [id, token, loadUserProfile]);

  const toggleFollow = async () => {
    if (isBlockedUser) {
      Alert.alert('User Blocked', 'Unblock this user from options to interact again.');
      return;
    }
    if (!user || !token) {
      Alert.alert('Error', 'You must be logged in to follow users');
      return;
    }

    const wasFollowing = isFollowing;
    const result = await follow.toggleFollow(id);
    if (!result) return;

    // Keep the follower counter in step: server count when reported,
    // otherwise ±1 for a confirmed follow / unfollow (not for requests).
    setUser((prev) => {
      if (!prev) return prev;
      const current = prev.stats?.followersCount || 0;
      let followersCount = current;
      if (result.followersCount !== undefined) {
        followersCount = result.followersCount;
      } else if (wasFollowing && !result.following) {
        followersCount = Math.max(0, current - 1);
      } else if (!wasFollowing && result.following) {
        followersCount = current + 1;
      }
      return {
        ...prev,
        stats: {
          followersCount,
          followingCount: prev.stats?.followingCount || 0,
          postsCount: prev.stats?.postsCount || 0,
        },
      };
    });
  };

  const handleMessage = () => {
    if (!user) return;
    if (isBlockedUser) {
      Alert.alert('User Blocked', 'Unblock this user first to start chatting.');
      return;
    }
    router.push({ pathname: '/chat', params: { userId: id, name: user.name || 'User' } });
  };

  const openPortfolio = () => {
    if (!user) return;
    router.push({ pathname: '/portfolio', params: { userId: id, name: user.name } });
  };

  const filteredPosts = filterPostsByType(posts, selectedFilter);

  return {
    user,
    posts,
    loading,
    isPrivateAccount,
    hasLimitedData,
    isBlockedUser,
    isFollowing,
    isPending,
    toggleFollow,
    handleMessage,
    openPortfolio,
    selectedFilter,
    setSelectedFilter,
    filteredPosts,
  };
}
