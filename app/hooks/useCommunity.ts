import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';
import { Community, CommunityGroup } from '@/types';

/**
 * Community detail screen logic: load community + groups, refresh, join the
 * community / a group, the header options menu (settings / leave) and admin
 * navigation. The screen and its header/list components stay presentational.
 */
export function useCommunity(id: string | undefined) {
  const router = useRouter();
  const { token } = useAuth();
  const confirm = useConfirm();

  const [community, setCommunity] = useState<Community | null>(null);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;

      // Fetch Community Details
      const res = (await api.community(id, token || undefined)) as any;
      setCommunity(res);

      if (token) {
        try {
          const groupsRes = (await api.communityGroups(id, token)) as any;
          const groupsList = Array.isArray(groupsRes) ? groupsRes : groupsRes?.data || [];
          setGroups(groupsList);
        } catch (e) {
          console.error('Failed to fetch groups independently', e);
          setGroups(res.groups || []);
        }
      } else {
        setGroups(res.groups || []);
      }
    } catch (error) {
      console.error('Failed to load community:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  const joinGroup = async (groupId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.joinGroup(id!, groupId, token || '');
      Alert.alert('Success', 'You have joined the group!');
      setJoinedGroups((prev) => [...prev, groupId]);
      refresh();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error?.message || 'Failed to join group');
    }
  };

  const joinCommunity = async () => {
    if (!id) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = (await api.joinCommunity(id, token || '')) as any;

      const status = res?.status;
      if (status === 'pending') {
        setCommunity((prev) => (prev ? { ...prev, isPending: true } : null));
      } else if (status === 'joined') {
        setCommunity((prev) => (prev ? { ...prev, isMember: true } : null));
      }

      refresh();
    } catch (error) {
      console.error(error);
    }
  };

  const isAdmin = community?.memberRole === 'admin' || community?.memberRole === 'owner';

  /** Whether a group card should show its Join button for the current user. */
  const showJoinForGroup = (group: CommunityGroup) =>
    !group.isMember && !isAdmin && !joinedGroups.includes(group._id);

  const openMenu = () => {
    if (!community) return;

    const options = [{ text: 'Cancel', style: 'cancel' as const }];

    if (isAdmin) {
      options.push({
        text: 'Community Settings',
        onPress: () => router.push(`/communities/${id}/settings`),
      } as any);
    }

    if (community.isMember && community.memberRole !== 'owner') {
      options.push({
        text: 'Leave Community',
        style: 'destructive' as const,
        onPress: async () => {
          if (
            await confirm({
              title: 'Leave Community',
              message: 'Are you sure?',
              confirmLabel: 'Leave',
              destructive: true,
            })
          ) {
            await api.leaveCommunity(id!, token || '');
            router.replace('/communities');
          }
        },
      } as any);
    }

    Alert.alert('Options', undefined, options);
  };

  const openGroup = (groupId: string) =>
    router.push({
      pathname: '/communities/[id]/groups/[groupId]',
      params: { id: id!, groupId },
    });

  const createGroup = () => router.push(`/communities/${id}/create-group`);

  return {
    community,
    groups,
    loading,
    refreshing,
    isAdmin,
    refresh,
    joinGroup,
    joinCommunity,
    showJoinForGroup,
    openMenu,
    openGroup,
    createGroup,
  };
}
