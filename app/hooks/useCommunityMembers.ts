import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityMember } from '@/types';

const PAGE_SIZE = 20;

/**
 * Community Members screen logic: paginated member list, the viewer's own
 * role (gates the ⋮ menu) and the promote / demote / remove action sheet.
 */
export function useCommunityMembers(id: string | undefined) {
  const { token } = useAuth();

  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadMembers = async (pageNum: number, reset = false) => {
    try {
      if (!id) return;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      // Get my role (only needed once really, but fine here)
      if (reset) {
        const comRes = (await api.community(id, token || undefined)) as any;
        setMyRole(comRes?.memberRole);
      }

      const memRes = (await api.communityMembers(id, pageNum, PAGE_SIZE, token || undefined)) as any;

      const newMembers = memRes?.data || [];
      setMembers((prev) => (reset ? newMembers : [...prev, ...newMembers]));
      setHasMore(newMembers.length >= PAGE_SIZE);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadMembers(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      loadMembers(page + 1, false);
    }
  };

  const updateRole = async (userId: string, role: 'admin' | 'moderator' | 'member') => {
    try {
      if (!id) return;
      await api.updateMemberRole(id, userId, role, token || '');
      loadMembers(0, true); // Refresh list
    } catch {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      if (!id) return;
      await api.removeMember(id, userId, token || '');
      loadMembers(0, true); // Refresh list
    } catch {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  const canManage = myRole === 'admin' || myRole === 'owner';

  const openMemberActions = (member: CommunityMember) => {
    // Cannot act on owner; must be admin to act
    if (!canManage) return;
    if (member.role === 'owner') return;
    const userId = member.user._id as string;

    const options = [{ text: 'Cancel', style: 'cancel' as const }];

    if (member.role !== 'admin') {
      options.push({
        text: 'Promote to Admin',
        onPress: () => updateRole(userId, 'admin'),
      } as any);
    }

    if (member.role === 'admin') {
      options.push({
        text: 'Demote to Member',
        onPress: () => updateRole(userId, 'member'),
      } as any);
    }

    options.push({
      text: 'Remove from Community',
      style: 'destructive' as const,
      onPress: () => removeMember(userId),
    } as any);

    Alert.alert('Manage Member', `Actions for ${member.user.name}`, options);
  };

  return {
    members,
    loading,
    loadingMore,
    canManage,
    loadMore,
    openMemberActions,
  };
}
