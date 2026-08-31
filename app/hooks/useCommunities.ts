import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Community } from '@/types';

export type CommunityTab = 'my' | 'discover';

/**
 * Communities list screen logic: My / Discover tabs, debounced search on
 * Discover, pull-to-refresh and optimistic join. The screen and its list
 * components stay presentational.
 */
export function useCommunities() {
  const { token, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<CommunityTab>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (authLoading) return;

    try {
      setLoading(true);
      let res: any;
      if (activeTab === 'my') {
        if (!token) {
          setCommunities([]);
          return;
        }
        res = (await api.myCommunities(0, 20, token)) as any;
      } else {
        res = (await api.communities({ search: searchQuery }, token || undefined)) as any;
      }

      setCommunities(res.data || []);
    } catch (error) {
      console.error('Failed to load communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, token, authLoading]);

  const loadDataRef = useRef(loadData);
  loadDataRef.current = loadData;

  // Tab change (and initial load): clear the old list and fetch immediately,
  // so "Discover" never shows the joined list for half a second first.
  useEffect(() => {
    setCommunities([]);
    setLoading(true);
    loadDataRef.current();
  }, [activeTab, token, authLoading]);

  // Search typing: debounced, and skipped on mount (the effect above loads).
  const isFirstSearchEffect = useRef(true);
  useEffect(() => {
    if (isFirstSearchEffect.current) {
      isFirstSearchEffect.current = false;
      return;
    }
    const timer = setTimeout(() => {
      loadDataRef.current();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  const join = async (id: string) => {
    try {
      setJoiningId(id);
      const res = (await api.joinCommunity(id, token || undefined)) as any;
      const status = res?.status;

      setCommunities((prev) =>
        prev.map((c) => {
          if (c._id !== id) return c;
          if (status === 'pending') {
            return { ...c, isPending: true };
          } else if (status === 'joined') {
            return { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 };
          }
          return c;
        })
      );
    } catch (error) {
      console.error('Failed to join:', error);
      // Revert or reload on error
      loadData();
    } finally {
      setJoiningId(null);
    }
  };

  return {
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    communities,
    joiningId,
    searchQuery,
    setSearchQuery,
    refresh,
    join,
  };
}
