import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';
import { CommunityPrivary } from '@/types';

/**
 * Community Settings screen logic: load (with admin gate), editable name /
 * description / privacy, save, delete (owner only) and the pending join
 * request count shown on the Join Requests row.
 */
export function useCommunitySettings(id: string | undefined) {
  const router = useRouter();
  const { token } = useAuth();
  const confirm = useConfirm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<CommunityPrivary>('public');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!id) return;
        const res = (await api.community(id, token || undefined)) as any;
        setCommunity(res);
        setName(res?.name || '');
        setDescription(res?.description || '');
        setPrivacy(res?.privacy || 'public');

        // Check permissions
        const role = res?.memberRole;
        if (role !== 'owner' && role !== 'admin') {
          Alert.alert('Access Denied', 'You do not have permission to view settings.');
          router.back();
        }
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load community settings');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    try {
      setSaving(true);
      await api.updateCommunity(id!, { name, description, privacy }, token || '');
      Alert.alert('Success', 'Community settings updated');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update community');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (
      await confirm({
        title: 'Delete Community',
        message: 'Are you sure you want to delete this community? This action cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
      })
    ) {
      try {
        await api.deleteCommunity(id!, token || '');
        router.replace('/communities');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to delete community');
      }
    }
  };

  const pendingCount: number = community?.pendingRequests?.length || 0;
  const isOwner = community?.memberRole === 'owner';

  const openRequests = () => router.push(`/communities/${id}/requests`);
  const openMembers = () => router.push(`/communities/${id}/members`);

  return {
    loading,
    saving,
    name,
    setName,
    description,
    setDescription,
    privacy,
    setPrivacy,
    pendingCount,
    isOwner,
    save,
    remove,
    openRequests,
    openMembers,
  };
}
