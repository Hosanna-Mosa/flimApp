import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export interface PortfolioItem {
  title: string;
  type: string;
  url: string;
}

const EMPTY_ITEM: PortfolioItem = { title: '', type: '', url: '' };

/**
 * Portfolio-screen logic. With no `userId` it edits the signed-in user's
 * portfolio (add / remove / save); with one it loads another user's links
 * read-only. The screen and its components stay presentational.
 */
export function usePortfolio(userId?: string) {
  const router = useRouter();
  const { user, updateProfile, token } = useAuth();

  const isOwn = !userId;

  const [items, setItems] = useState<PortfolioItem[]>(isOwn ? ((user as any)?.portfolio || []) : []);
  const [loading, setLoading] = useState<boolean>(!isOwn);
  const [saving, setSaving] = useState<boolean>(false);

  const [draft, setDraft] = useState<PortfolioItem>(EMPTY_ITEM);
  const [formVisible, setFormVisible] = useState(false);

  useEffect(() => {
    if (!isOwn && userId) {
      loadOtherUserPortfolio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadOtherUserPortfolio = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const otherUser = await api.user(userId as string, token || undefined);
      setItems((otherUser as any)?.portfolio || []);
    } catch (err) {
      console.error('Failed to load other user portfolio:', err);
      Alert.alert('Error', 'Failed to load portfolio links');
    } finally {
      setLoading(false);
    }
  };

  const updateDraft = (patch: Partial<PortfolioItem>) => setDraft((prev) => ({ ...prev, ...patch }));

  const openForm = () => setFormVisible(true);

  const cancelForm = () => {
    setFormVisible(false);
    setDraft(EMPTY_ITEM);
  };

  const addItem = () => {
    if (!draft.title || !draft.url) {
      Alert.alert('Error', 'Please fill in title and URL');
      return;
    }
    if (!draft.url.startsWith('http://') && !draft.url.startsWith('https://')) {
      Alert.alert('Error', 'URL must start with http:// or https://');
      return;
    }
    setItems([...items, { ...draft }]);
    setDraft(EMPTY_ITEM);
    setFormVisible(false);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const save = async () => {
    try {
      setSaving(true);
      await updateProfile({ portfolio: items } as any);
      Alert.alert('Success', 'Portfolio updated successfully', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      console.error('[Portfolio] Save error:', error);
      Alert.alert('Error', error.message || 'Failed to save portfolio');
    } finally {
      setSaving(false);
    }
  };

  return {
    isOwn,
    items,
    loading,
    saving,
    form: {
      visible: formVisible,
      draft,
      update: updateDraft,
      open: openForm,
      cancel: cancelForm,
      add: addItem,
    },
    removeItem,
    save,
  };
}
