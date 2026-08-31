import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePostActions } from '@/hooks/usePostActions';
import { mapApiPostToPost } from '@/utils/mappers';
import { Post } from '@/types';

/**
 * Crowd-fund list: fetches the first 20 donation posts every time the screen
 * gains focus (so a freshly created request shows up), pull-to-refresh, and
 * the shared like / comment / share / save handlers.
 */
export function useDonations() {
  const { token } = useAuth();

  const [posts, setPosts] = useState<Post[]>([]);
  const { handleLike, handleComment, handleShare, handleSave } = usePostActions(posts, setPosts);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDonations = async () => {
    try {
      const response = (await api.getDonations(0, 20, token || undefined)) as any;
      if (response) {
        // Map backend posts (handle both array directly or response object)
        const data = Array.isArray(response) ? response : response.data || [];

        setPosts(data.map((post: any) => mapApiPostToPost(post)));
      }
    } catch (error) {
      console.error('Error fetching donation posts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Refetch whenever the screen is focused so a newly created request shows up.
  useFocusEffect(
    useCallback(() => {
      fetchDonations();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDonations();
  };

  return { posts, isLoading, refreshing, onRefresh, handleLike, handleComment, handleShare, handleSave };
}
