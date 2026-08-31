import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/hooks/useConfirm';
import { ChatInputBarHandle } from '@/components/chat/ChatInputBar';
import { Comment, PostDetail } from '@/types';

/**
 * All post-detail logic: loading the post + comments (and refreshing on
 * re-focus), optimistic like, add/delete/report comments, replies, share,
 * the author/viewer options menu, caption editing and post deletion. The
 * screen and its components stay presentational.
 */
export function usePostDetail(id: string) {
  const router = useRouter();
  const { token, user, reportContent } = useAuth();
  const confirm = useConfirm();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const commentInputRef = useRef<ChatInputBarHandle>(null);

  // ---- Identity helpers
  const isCurrentUser = useCallback(
    (userId?: string) => {
      const u = user as any;
      return !!user && !!userId && (u.id === userId || u._id === userId);
    },
    [user]
  );
  const isAuthor = isCurrentUser(post?.author?._id);
  const isCommentAuthor = useCallback((comment: Comment) => isCurrentUser(comment.user._id), [isCurrentUser]);
  const canDeleteComment = useCallback(
    (comment: Comment) => isCommentAuthor(comment) || isAuthor,
    [isCommentAuthor, isAuthor]
  );

  // ---- Load + focus refresh
  const loadPostAndComments = useCallback(async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        api.getPost(id, token || undefined) as any,
        api.getComments(id, 0, 50, 'recent', token || undefined) as any,
      ]);
      setPost(postData);
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData.engagement?.likesCount || 0);
      setComments(commentsData.data || commentsData || []);
    } catch (error) {
      console.error('[PostDetail] Error loading:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (id && token) loadPostAndComments();
  }, [id, token, loadPostAndComments]);

  // Refresh when the screen regains focus (skip the initial mount).
  const isInitialMount = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }
      if (id && token) loadPostAndComments();
    }, [id, token, loadPostAndComments])
  );

  const bumpCommentCount = (delta: number) => {
    setPost((prev) =>
      prev
        ? {
            ...prev,
            engagement: {
              ...prev.engagement,
              commentsCount: Math.max(0, (prev.engagement?.commentsCount || 0) + delta),
            },
          }
        : prev
    );
  };

  // ---- Like (optimistic)
  const handleLike = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikesCount((prev) => (wasLiked ? prev - 1 : prev + 1));
      if (wasLiked) {
        await api.unlikePost(id, token!);
      } else {
        await api.likePost(id, token!);
      }
    } catch {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
    }
  };

  // ---- Comments
  /** Returns true when the comment was posted (ChatInputBar clears itself). */
  const handleAddComment = async (text: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      const result = (await api.addComment(id, text, replyTo?._id, token || undefined)) as any;
      const newComment: Comment = result.data || result;

      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === replyTo._id
              ? { ...c, repliesCount: (c.repliesCount || 0) + 1, replies: [newComment, ...(c.replies || [])] }
              : c
          )
        );
        setReplyTo(null);
      } else {
        setComments((prev) => [newComment, ...prev]);
      }

      bumpCommentCount(1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch {
      Alert.alert('Error', 'Failed to add comment');
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply = false, parentId?: string) => {
    if (
      !(await confirm({
        title: 'Delete Comment',
        message: 'Are you sure you want to delete this comment?',
        confirmLabel: 'Delete',
        destructive: true,
      }))
    )
      return;
    if (!token) return;
    try {
      await api.deleteComment(commentId, token);
      if (isReply && parentId) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === parentId
              ? {
                  ...c,
                  repliesCount: Math.max(0, (c.repliesCount || 0) - 1),
                  replies: c.replies?.filter((r) => r._id !== commentId),
                }
              : c
          )
        );
      } else {
        setComments((prev) => prev.filter((c) => c._id !== commentId));
      }
      bumpCommentCount(-1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    commentInputRef.current?.focus();
  };

  const cancelReply = () => setReplyTo(null);

  const handleCommentOptions = (comment: Comment) => {
    Alert.alert('Comment Options', 'Choose an action', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report User',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportContent('user', comment.user._id);
            Alert.alert('Reported', 'User has been reported to admin.');
          } catch {
            Alert.alert('Error', 'Failed to report user');
          }
        },
      },
    ]);
  };

  const handleReportComment = (commentId: string) => {
    Alert.alert('Report Comment', 'Are you sure you want to report this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await reportContent('comment', commentId);
            Alert.alert('Reported', 'Thank you. We will review this comment.');
          } catch {
            Alert.alert('Error', 'Failed to report comment');
          }
        },
      },
    ]);
  };

  /** Loads the full reply list for a top-level comment. */
  const loadReplies = async (commentId: string) => {
    const res = (await api.getCommentReplies(commentId, 0, 50, token || undefined)) as any;
    setComments((prev) => prev.map((c) => (c._id === commentId ? { ...c, replies: res.data || res } : c)));
  };

  // ---- Share
  const handleShare = async () => {
    try {
      const shareUrl = `https://filmy.app/post/${id}`;
      const message = post?.caption ? `${post.caption}\n\n${shareUrl}` : shareUrl;
      await Share.share({ message, url: shareUrl });
    } catch {
      // user dismissed the share sheet
    }
  };

  // ---- Edit caption
  const [isEditVisible, setIsEditVisible] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');
  const [isUpdatingCaption, setIsUpdatingCaption] = useState(false);

  const openEditCaption = () => {
    setEditedCaption(post?.caption || '');
    setIsEditVisible(true);
  };

  const closeEditCaption = () => setIsEditVisible(false);

  const submitCaption = async () => {
    if (!post) return;
    if (editedCaption.trim() === post.caption) {
      setIsEditVisible(false);
      return;
    }
    try {
      setIsUpdatingCaption(true);
      if (!token) return;
      await api.updatePost(id, { caption: editedCaption.trim() }, token);
      setPost({ ...post, caption: editedCaption.trim() });
      setIsEditVisible(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to update caption');
    } finally {
      setIsUpdatingCaption(false);
    }
  };

  // ---- Delete post
  const confirmDeletePost = async () => {
    if (
      !(await confirm({
        title: 'Delete Post',
        message: 'Are you sure you want to delete this post? This action cannot be undone.',
        confirmLabel: 'Delete',
        destructive: true,
      }))
    )
      return;
    if (!token) return;
    try {
      setLoading(true);
      await api.deletePost(id, token);
      router.back();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert('Error', 'Failed to delete post');
      setLoading(false);
    }
  };

  // ---- More options (author vs viewer)
  const handleMoreOptions = () => {
    if (!post) return;
    if (isAuthor) {
      Alert.alert('Post Options', 'What would you like to do with this post?', [
        { text: 'Edit Caption', onPress: openEditCaption },
        { text: 'Delete Post', style: 'destructive', onPress: confirmDeletePost },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else {
      Alert.alert('Post Options', 'Options for this post', [
        {
          text: 'Report Post',
          style: 'destructive',
          onPress: () => Alert.alert('Reported', 'Thank you for reporting. We will review this post.'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const goToUser = (userId: string) => router.push(`/user/${userId}`);

  return {
    post,
    comments,
    loading,
    submitting,
    isLiked,
    likesCount,
    replyTo,
    commentInputRef,
    isCommentAuthor,
    canDeleteComment,
    handleLike,
    handleShare,
    handleMoreOptions,
    handleAddComment,
    handleDeleteComment,
    handleReply,
    cancelReply,
    handleCommentOptions,
    handleReportComment,
    loadReplies,
    goToUser,
    editCaption: {
      visible: isEditVisible,
      value: editedCaption,
      loading: isUpdatingCaption,
      setValue: setEditedCaption,
      close: closeEditCaption,
      submit: submitCaption,
    },
  };
}
