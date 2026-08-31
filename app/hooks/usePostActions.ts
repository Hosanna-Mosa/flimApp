import { Dispatch, SetStateAction, useCallback } from 'react';
import { Alert, Share } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { Post } from '@/types';

/**
 * Like / save / share / comment handlers for any list of posts, with
 * optimistic updates and server reconciliation. Shared by the feed, saved
 * posts, and crowd-fund lists so a post behaves identically everywhere.
 */
export function usePostActions(posts: Post[], setPosts: Dispatch<SetStateAction<Post[]>>) {
  const { token } = useAuth();
  const router = useRouter();

  const handleLike = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post || !token) return;
      const wasLiked = post.isLiked;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, isLiked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 } : p
        )
      );

      try {
        const result = (wasLiked
          ? await api.unlikePost(postId, token)
          : await api.likePost(postId, token)) as any;
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, likes: result?.likesCount ?? p.likes, isLiked: !wasLiked } : p
          )
        );
      } catch {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, isLiked: wasLiked, likes: wasLiked ? p.likes + 1 : p.likes - 1 } : p
          )
        );
      }
    },
    [posts, setPosts, token]
  );

  const handleSave = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post || !token) return;
      const wasSaved = !!post.isSaved;

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: !wasSaved } : p)));

      try {
        const result = (await api.toggleSavePost(postId, token)) as any;
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: result?.saved ?? !wasSaved } : p)));
      } catch {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isSaved: wasSaved } : p)));
        Alert.alert('Error', 'Failed to save post');
      }
    },
    [posts, setPosts, token]
  );

  const handleShare = useCallback(
    async (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const shareUrl = `https://filmy.app/post/${postId}`;
      try {
        await Share.share({ message: post.caption ? `${post.caption}\n\n${shareUrl}` : shareUrl, url: shareUrl });
      } catch {
        // user dismissed the share sheet
      }
    },
    [posts]
  );

  const handleComment = useCallback((postId: string) => router.push(`/post/${postId}`), [router]);

  return { handleLike, handleSave, handleShare, handleComment };
}
