import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { CommunityGroup } from '@/types';

/**
 * "New Poll" screen logic: loads the groups the member may post to
 * (announcement-only groups are admin/owner only), owns the question and
 * option fields, validates, and submits the poll then jumps to the group.
 */
export function useNewPoll(communityId: string | undefined, initialGroupId?: string) {
  const router = useRouter();
  const { token } = useAuth();

  const [groupId, setGroupId] = useState(initialGroupId || '');
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Poll State
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGroups = async () => {
    try {
      setLoadingGroups(true);
      if (communityId) {
        // Get role first
        const comRes = (await api.community(communityId, token || undefined)) as any;
        const role = comRes?.memberRole;
        const isAdmin = role === 'admin' || role === 'owner';

        const res = (await api.communityGroups(communityId, token || undefined)) as any;

        // Filter groups: Members can join any, but can only post to non-announcement groups
        // Admins can post to any.
        const postableGroups = (res || []).filter((g: any) => {
          if (!g.isMember) return false;
          if (g.isAnnouncementOnly && !isAdmin) return false;
          return true;
        });

        setGroups(postableGroups);
        if (!groupId && postableGroups.length > 0) {
          setGroupId(postableGroups[0]._id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroups(false);
    }
  };

  const changeOption = (text: string, index: number) => {
    const newOptions = [...pollOptions];
    newOptions[index] = text;
    setPollOptions(newOptions);
  };

  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removeOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = pollOptions.filter((_, i) => i !== index);
      setPollOptions(newOptions);
    }
  };

  const isValid = !!groupId && !!pollQuestion.trim() && pollOptions.every((o) => !!o.trim());

  const submit = async () => {
    if (!isValid) {
      Alert.alert('Incomplete poll', 'Add a question and fill in every option.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        groupId,
        type: 'poll',
        content: pollQuestion,
        poll: {
          question: pollQuestion,
          options: pollOptions.map((text) => ({ text })),
          allowMultiple: false,
        },
      };

      if (communityId) {
        const res = (await api.createCommunityPost(communityId, payload, token || undefined)) as any;
        if (res && res.status === 'success') {
          // Success
        }
      }

      // Navigate back
      if (groupId) {
        try {
          router.replace({
            pathname: '/communities/[id]/groups/[groupId]',
            params: { id: communityId!, groupId },
          });
        } catch {
          router.back();
        }
      } else {
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedGroupName = groups.find((g) => g._id === groupId)?.name || 'Select Group';

  return {
    groups,
    loadingGroups,
    groupId,
    setGroupId,
    selectedGroupName,
    question: pollQuestion,
    setQuestion: setPollQuestion,
    options: pollOptions,
    changeOption,
    addOption,
    removeOption,
    isValid,
    submitting,
    submit,
  };
}
