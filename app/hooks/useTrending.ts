import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export interface TrendingPost {
  id: string;
  thumbnailUrl?: string;
  mediaUrl?: string;
  caption: string;
  type: string;
  likes: number;
  userId?: string;
}

/**
 * Trending-screen logic: fetches the top 20 trending posts (re-run when the
 * token changes), drops posts from blocked users, and handles pull-to-refresh.
 */
export function useTrending() {
  const { token, blockedUsers } = useAuth();

  const [posts, setPosts] = useState<TrendingPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingPosts = async () => {
    try {
      // Using the api wrapper handles response unwrapping
      const data = (await api.getTrendingFeed(0, 20, token || undefined)) as any[];
      if (Array.isArray(data)) {
        // Map backend posts to local structure if needed, or use as is
        // Currently the UI expects: id, thumbnail/mediaUrl, caption, type, likes
        const mappedPosts: TrendingPost[] = data
          .map((post: any) => ({
            id: post._id,
            thumbnailUrl: post.media?.thumbnail || post.thumbnailUrl,
            mediaUrl: post.media?.url || post.mediaUrl,
            caption: post.caption,
            type: post.type,
            likes: post.engagement?.likesCount || 0,
            userId: post.userId || post.author?._id || post.author?.id,
          }))
          .filter((post) => !blockedUsers.includes(post.userId));
        setPosts(mappedPosts);
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrendingPosts();
  };

  return { posts, isLoading, refreshing, onRefresh };
}
