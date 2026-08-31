import { useCallback, useEffect, useState } from 'react';
import { Alert, DeviceEventEmitter } from 'react-native';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

/** Server-side relationship with a user: a pending private-account request, accepted, or none. */
export type FollowStatus = 'pending' | 'accepted' | null;

/** What a follow toggle settled on, once the server answered. */
export interface FollowToggleResult {
  following: boolean;
  status: FollowStatus;
  /** The target's follower count when the API reports it back. */
  followersCount?: number;
}

function withMember(set: Set<string>, id: string, present: boolean): Set<string> {
  if (set.has(id) === present) return set;
  const next = new Set(set);
  if (present) {
    next.add(id);
  } else {
    next.delete(id);
  }
  return next;
}

/**
 * Local source of truth for "who am I following", shared by any screen
 * that shows follow buttons. Loads the full following list, applies
 * optimistic toggles (with private-account "request pending" handling),
 * and stays in sync with other screens via the 'user_follow_changed'
 * DeviceEventEmitter channel.
 */
export function useFollow() {
  const { user, token } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  // Users we have sent a (still unanswered) follow request to.
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

  const fetchFollowingList = useCallback(async () => {
    if (!user || !token) return;
    try {
      const userId = user.id || (user as any)._id;
      if (!userId) return;

      // Fetch a large number of following users to build the local source of truth
      const result = await api.getFollowing(userId, 0, 1000, token);

      let followingData = [];
      if (Array.isArray(result)) {
        followingData = result;
      } else if (result && (result as any).data && Array.isArray((result as any).data)) {
        followingData = (result as any).data;
      }

      if (followingData.length > 0 || Array.isArray(result)) {
        const rawIds = followingData.map((u: any) => u._id || u.id);
        setFollowingIds(new Set<string>(rawIds));
      }
    } catch {
      // keep whatever we already have
    }
  }, [user, token]);

  /** Merge ids learnt elsewhere (e.g. `author.isFollowing` on feed posts). */
  const addFollowing = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setFollowingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => {
        if (id) next.add(id);
      });
      return next;
    });
  }, []);

  /** Set one user's relationship outright (e.g. from a server probe). */
  const applyFollowStatus = useCallback((userId: string, following: boolean, status: FollowStatus) => {
    setFollowingIds((prev) => withMember(prev, userId, following));
    setPendingIds((prev) => withMember(prev, userId, status === 'pending'));
  }, []);

  /**
   * Ask the server where we stand with `userId` and sync local state.
   * Resolves to null (and leaves state untouched) when the probe fails.
   */
  const refreshFollowStatus = useCallback(
    async (userId: string): Promise<{ following: boolean; status: FollowStatus } | null> => {
      try {
        const res = (await api.getFollowStatus(userId, token || undefined)) as any;
        const status: FollowStatus = res?.status ?? res?.data?.status ?? null;
        const following: boolean = res?.isFollowing ?? res?.data?.isFollowing ?? false;
        applyFollowStatus(userId, following, status);
        return { following, status };
      } catch {
        return null;
      }
    },
    [token, applyFollowStatus]
  );

  // Other screens (profile, notifications) broadcast follow changes.
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('user_follow_changed', ({ userId, following, status }) => {
      setFollowingIds((prev) => withMember(prev, userId, !!following));
      setPendingIds((prev) => withMember(prev, userId, status === 'pending'));
    });

    return () => subscription.remove();
  }, []);

  /**
   * Follow / unfollow (or cancel a pending request) with an optimistic
   * update. Resolves to the confirmed state, or undefined when nothing could
   * be confirmed (no token, or an error that was already reported).
   */
  const toggleFollow = async (userId: string): Promise<FollowToggleResult | undefined> => {
    const wasFollowing = followingIds.has(userId);
    const wasPending = pendingIds.has(userId);
    const removing = wasFollowing || wasPending;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update
      applyFollowStatus(userId, !removing, null);

      if (!token) return undefined;

      if (removing) {
        // Unfollow, or cancel the pending request
        const result = (await api.unfollowUser(userId, token)) as any;
        DeviceEventEmitter.emit('user_follow_changed', { userId, following: false, status: null });
        return { following: false, status: null, followersCount: result?.followersCount };
      }

      const result = (await api.followUser(userId, token)) as any;

      if (result?.status === 'pending') {
        // Private account - request sent
        Alert.alert('Follow Request Sent', 'This account is private. Your request is pending approval.');
        applyFollowStatus(userId, false, 'pending');
        DeviceEventEmitter.emit('user_follow_changed', { userId, following: false, status: 'pending' });
        return { following: false, status: 'pending', followersCount: result?.followersCount };
      }

      DeviceEventEmitter.emit('user_follow_changed', { userId, following: true, status: 'accepted' });
      return { following: true, status: 'accepted', followersCount: result?.followersCount };
    } catch (error: any) {
      if (error?.message?.includes('Already following this user')) {
        // We are already following, so the optimistic state (following) is actually correct.
        applyFollowStatus(userId, true, 'accepted');
        DeviceEventEmitter.emit('user_follow_changed', { userId, following: true, status: 'accepted' });
        return undefined;
      }

      // Roll back to the pre-toggle state, then let the server correct us if it can.
      applyFollowStatus(userId, wasFollowing, wasPending ? 'pending' : null);
      await refreshFollowStatus(userId);
      Alert.alert('Error', error?.message || 'Failed to update follow status');
      return undefined;
    }
  };

  const isFollowing = useCallback((userId: string) => followingIds.has(userId), [followingIds]);
  const isPending = useCallback((userId: string) => pendingIds.has(userId), [pendingIds]);

  return {
    followingIds,
    pendingIds,
    isFollowing,
    isPending,
    toggleFollow,
    fetchFollowingList,
    addFollowing,
    applyFollowStatus,
    refreshFollowStatus,
  };
}

export type FollowState = ReturnType<typeof useFollow>;
