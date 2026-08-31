import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { User } from '@/types';

/** A pending requester as populated by the backend (always has an id). */
export type JoinRequester = Omit<User, '_id'> & { _id: string };

/**
 * Join Requests screen logic: pending requesters (populated by the backend
 * for admins), refresh, approve and reject.
 */
export function useJoinRequests(id: string | undefined) {
  const { token } = useAuth();

  const [requests, setRequests] = useState<JoinRequester[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;
      const res = (await api.community(id, token || undefined)) as any;
      // pendingRequests is now populated by backend for admins
      setRequests(res?.pendingRequests || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load requests');
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

  const approve = async (userId: string) => {
    try {
      await api.approveJoinRequest(id!, userId, token || '');
      loadData(); // Refresh list
    } catch {
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const reject = async (userId: string) => {
    try {
      await api.rejectJoinRequest(id!, userId, token || '');
      loadData(); // Refresh list
    } catch {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  return { requests, loading, refreshing, refresh, approve, reject };
}
