import { useState, useEffect, useCallback } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

export type NetworkType = 'followers' | 'following';

const PAGE_SIZE = 20;

/**
 * Followers / Following list for a user: paginated load, debounced search
 * (500ms), pull-to-refresh, and the header title for the list type.
 */
export function useNetwork(userId: string | undefined, type: NetworkType | undefined) {
  const { token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const title = type === 'following' ? 'Following' : 'Followers';

  const loadData = useCallback(
    async (pageNum = 0, shouldRefresh = false, query = searchQuery) => {
      if (!userId) return;

      try {
        if (pageNum === 0) setLoading(true);

        const response = await (type === 'following'
          ? api.getFollowing(userId, pageNum, PAGE_SIZE, token || undefined, query)
          : api.getFollowers(userId, pageNum, PAGE_SIZE, token || undefined, query));

        // Handle unwrapped response (array) or legacy structure (object with data field)
        let data = [];
        if (Array.isArray(response)) {
          data = response;
        } else if (response && (response as any).data) {
          // Check for double nesting: response.data.data
          if (Array.isArray((response as any).data)) {
            data = (response as any).data;
          } else if ((response as any).data.data && Array.isArray((response as any).data.data)) {
            data = (response as any).data.data;
          }
        }

        if (shouldRefresh || pageNum === 0) {
          setUsers(data);
        } else {
          setUsers((prev) => [...prev, ...data]);
        }

        setHasMore(data.length === PAGE_SIZE);
        setPage(pageNum);
      } catch (error: any) {
        console.error('[Network] Error loading network data:', error?.message || error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // Removed searchQuery from dependency to avoid loop, passed as arg
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, type, token]
  );

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData(0, true, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(0, true, searchQuery);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadData(page + 1, false, searchQuery);
    }
  };

  const emptyTitle = searchQuery
    ? `No matching ${type} found`
    : type === 'following'
      ? 'Not following anyone yet'
      : 'No followers yet';

  return {
    title,
    users,
    searchQuery,
    setSearchQuery,
    refreshing,
    onRefresh,
    loadMore,
    /** Initial full-screen spinner (first page still loading). */
    showLoading: loading && page === 0,
    /** Footer spinner while a further page loads. */
    loadingMore: loading && page > 0,
    emptyTitle,
  };
}
