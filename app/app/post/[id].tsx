import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from 'expo-router';
import { Image } from 'expo-image';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  ArrowLeft,
  Music,
  BadgeCheck,
  MoreVertical,
  Pause,
  Play,
  FileText,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Video, ResizeMode, Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Comment {
  _id: string;
  content: string;
  user: {
    _id: string;
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  createdAt: string;
  likesCount?: number;
  repliesCount?: number;
  parentComment?: string | null;
  replies?: Comment[];
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();

  // console.log('[PostDetail] Current user:', user ? `${user.name} (${(user as any)._id || user.id})` : 'Not logged in');

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [hiddenReplies, setHiddenReplies] = useState<Record<string, boolean>>({});
  const commentInputRef = useRef<TextInput>(null);

  // Track if this is the initial mount
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (id && token) {
      loadPostAndComments();
    }
  }, [id, token]);

  // Refresh post data when screen comes into focus (skip initial mount)
  useFocusEffect(
    useCallback(() => {
      // Skip the first focus (initial mount)
      if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
      }

      // Refresh on subsequent focuses
      if (id && token) {
        // console.log('[PostDetail] Screen focused - refreshing post data');
        loadPostAndComments();
      }
    }, [id, token])
  );

  const loadPostAndComments = async () => {
    try {
      setLoading(true);
      const [postData, commentsData] = await Promise.all([
        api.getPost(id, token || undefined) as any,
        api.getComments(id, 0, 50, 'recent', token || undefined) as any,
      ]);

      // Set post data
      setPost(postData);

      // Set like status and count from post data
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData.engagement?.likesCount || 0);

      // Set comments
      setComments(commentsData.data || commentsData || []);

    } catch (error) {
      console.error('[PostDetail] Error loading:', error);
      Alert.alert('Error', 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const wasLiked = isLiked;
      setIsLiked(!wasLiked);
      setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

      if (wasLiked) {
        await api.unlikePost(id, token || undefined);
      } else {
        await api.likePost(id, token || undefined);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      // console.error('[PostDetail] Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    try {
      setSubmitting(true);
      const result = await api.addComment(
        id,
        commentText.trim(),
        replyTo?._id,
        token || undefined
      ) as any;

      const newComment = result.data || result;

      if (replyTo) {
        // Add as reply to parent
        setComments(prev => {
          return prev.map(c => {
            if (c._id === replyTo._id) {
              return {
                ...c,
                repliesCount: (c.repliesCount || 0) + 1,
                replies: [newComment, ...(c.replies || [])]
              };
            }
            return c;
          });
        });
        setReplyTo(null);
      } else {
        // Add as top-level comment
        setComments(prev => [newComment, ...prev]);
      }

      setCommentText('');

      // Update post comment count
      if (post) {
        setPost({
          ...post,
          engagement: {
            ...post.engagement,
            commentsCount: (post.engagement?.commentsCount || 0) + 1,
          },
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, isReply = false, parentId?: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteComment(commentId, token || undefined);

              if (isReply && parentId) {
                setComments(prev => prev.map(c => {
                  if (c._id === parentId) {
                    return {
                      ...c,
                      repliesCount: Math.max(0, (c.repliesCount || 0) - 1),
                      replies: c.replies?.filter(r => r._id !== commentId)
                    };
                  }
                  return c;
                }));
              } else {
                setComments(prev => prev.filter(c => c._id !== commentId));
              }

              // Update post comment count
              if (post) {
                setPost({
                  ...post,
                  engagement: {
                    ...post.engagement,
                    commentsCount: Math.max(0, (post.engagement?.commentsCount || 0) - 1),
                  },
                });
              }

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete comment');
            }
          }
        }
      ]
    );
  };

  const handleReply = (comment: Comment) => {
    setReplyTo(comment);
    commentInputRef.current?.focus();
  };

  const toggleHiddenReplies = (commentId: string) => {
    setHiddenReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const [sound, setSound] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const videoRef = useRef<any>(null);
  const [videoStatus, setVideoStatus] = useState<any>(null);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const toggleAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        setLoadingAudio(true);
        const mediaUrl = post.media?.url || post.mediaUrl;
        if (!mediaUrl) {
          setLoadingAudio(false);
          return;
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: mediaUrl },
          { shouldPlay: true },
          (status: any) => {
            if (status.isLoaded) {
              setAudioPosition(status.positionMillis);
              setAudioDuration(status.durationMillis || 0);
              setIsPlaying(status.isPlaying);
              if (status.didJustFinish) {
                setIsPlaying(false);
                setAudioPosition(0);
                newSound.setPositionAsync(0);
              }
            }
          }
        );
        setSound(newSound);
        setLoadingAudio(false);
        setIsPlaying(true);
      }
    } catch (error) {
      setLoadingAudio(false);
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const toggleVideo = async () => {
    if (!videoRef.current) return;
    if (videoStatus?.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const renderMedia = () => {
    if (!post) return null;
    const mediaUrl = post.media?.url || post.mediaUrl;
    const thumbnailUrl = post.media?.thumbnail || post.thumbnailUrl;

    if (post.type === 'video') {
      const ratio = post.media?.width && post.media?.height ? post.media.width / post.media.height : 16 / 9;

      return (
        <View style={[styles.mediaContainer, { aspectRatio: ratio, minHeight: 250 }]}>
          <Video
            ref={videoRef}
            style={styles.media}
            source={{ uri: mediaUrl }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
            usePoster={!!thumbnailUrl}
            onPlaybackStatusUpdate={(status: any) => setVideoStatus(status)}
            onError={(e: string) => console.log('Video Playback Error:', e)}
          />
          {!videoStatus?.isPlaying && (
            <TouchableOpacity style={styles.centerPlayButton} onPress={toggleVideo}>
              <Play size={40} color="#fff" fill="#fff" />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (post.type === 'audio') {
      const formatTime = (millis: number) => {
        const minutes = Math.floor(millis / 60000);
        const seconds = ((millis % 60000) / 1000).toFixed(0);
        return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
      };

      return (
        <View style={[styles.audioCard, { backgroundColor: colors.surface }]}>
          <View style={styles.audioRow}>
            <TouchableOpacity onPress={toggleAudio} disabled={loadingAudio}>
              {loadingAudio ? (
                <ActivityIndicator color={colors.primary} />
              ) : isPlaying ? (
                <Pause size={32} color={colors.primary} fill={colors.primary} />
              ) : (
                <Play size={32} color={colors.primary} fill={colors.primary} />
              )}
            </TouchableOpacity>

            <View style={styles.audioProgress}>
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>{formatTime(audioPosition)}</Text>
              <Slider
                style={{ flex: 1, marginHorizontal: 8 }}
                minimumValue={0}
                maximumValue={audioDuration || 100}
                value={audioPosition}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
                onSlidingComplete={handleSeek}
                disabled={!sound}
              />
              <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                {audioDuration ? formatTime(audioDuration) : '--:--'}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    if (post.type === 'script') {
      return (
        <TouchableOpacity
          style={[styles.scriptCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            WebBrowser.openBrowserAsync(mediaUrl);
          }}
        >
          <View style={styles.genericScriptCard}>
            <View style={styles.scriptIcon}>
              <FileText size={48} color={colors.primary} />
            </View>
            <Text style={[styles.scriptTitle, { color: colors.text }]}>Document</Text>
            <Text style={[styles.scriptSubtitle, { color: colors.primary }]}>Tap to Open</Text>
          </View>
        </TouchableOpacity>
      );
    }

    if (post.type === 'text') {
      return null;
    }

    // Image
    const imageRatio = post.media?.width && post.media?.height ? post.media.width / post.media.height : 1;
    return (
      <View style={[styles.mediaContainer, { aspectRatio: imageRatio, minHeight: 300 }]}>
        <Image
          source={{ uri: mediaUrl }}
          style={styles.media}
          contentFit="cover"
        />
      </View>
    );
  };

  const handleShare = async () => {
    try {
      const shareUrl = `https://filmy.app/post/${id}`;
      const message = post?.caption
        ? `${post.caption}\n\n${shareUrl}`
        : shareUrl;

      await Share.share({
        message,
        url: shareUrl,
      });
    } catch (error) {
      // console.error('[PostDetail] Share error:', error);
    }
  };

  const handleMoreOptions = () => {
    if (!post) return;

    const isAuthor = user && ((user as any).id === post.author?._id || (user as any)._id === post.author?._id);

    if (isAuthor) {
      Alert.alert(
        'Post Options',
        'What would you like to do with this post?',
        [
          {
            text: 'Edit Caption',
            onPress: () => handleEditCaption(),
          },
          {
            text: 'Delete Post',
            style: 'destructive',
            onPress: () => confirmDelete(),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    } else {
      Alert.alert(
        'Post Options',
        'Options for this post',
        [
          {
            text: 'Report Post',
            style: 'destructive',
            onPress: () => Alert.alert('Reported', 'Thank you for reporting. We will review this post.'),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleEditCaption = () => {
    Alert.prompt(
      'Edit Caption',
      'Update your post caption',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Update',
          onPress: async (newCaption: string | undefined) => {
            if (newCaption === undefined) return;
            try {
              setLoading(true);
              await api.updatePost(id, { caption: newCaption }, token || undefined);
              setPost({ ...post, caption: newCaption });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to update caption');
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      'plain-text',
      post.caption
    );
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await api.deletePost(id, token || undefined);
              router.back();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete post');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderComment = (comment: Comment, isReply = false, parentId?: string) => {
    const isCommentAuthor = user && ((user as any).id === comment.user._id || (user as any)._id === comment.user._id);
    const isPostAuthor = user && ((user as any).id === post.author._id || (user as any)._id === post.author._id);
    const canDelete = isCommentAuthor || isPostAuthor;

    return (
      <View style={[styles.commentItem, isReply && styles.replyItem]}>
        <Image
          source={{ uri: comment.user?.avatar || '' }}
          style={isReply ? styles.replyAvatar : styles.commentAvatar}
          contentFit="cover"
        />
        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.commentNameRow}>
                <Text style={[styles.commentUserName, { color: colors.text }]}>
                  {comment.user?.name || 'Unknown User'}
                </Text>
                {comment.user?.isVerified && (
                  <BadgeCheck size={12} color="#FFFFFF" fill={colors.primary} />
                )}
              </View>
              <Text style={[styles.commentText, { color: colors.text }]}>
                {comment.content}
              </Text>
              <View style={styles.commentFooter}>
                <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
                {!isReply && (
                  <TouchableOpacity onPress={() => handleReply(comment)} style={styles.footerAction}>
                    <Text style={[styles.footerActionText, { color: colors.textSecondary }]}>Reply</Text>
                  </TouchableOpacity>
                )}
                {canDelete && (
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment._id, isReply, parentId)}
                    style={styles.footerAction}
                  >
                    <Text style={[styles.footerActionText, { color: colors.error }]}>Delete</Text>
                  </TouchableOpacity>
                )}
                {comment.replies && comment.replies.length > 0 && (
                  <TouchableOpacity
                    onPress={() => toggleHiddenReplies(comment._id)}
                    style={styles.footerAction}
                  >
                    <Text style={[styles.footerActionText, { color: colors.primary }]}>
                      {hiddenReplies[comment._id] ? 'Show replies' : 'Hide replies'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Render Replies */}
          {comment.replies && comment.replies.length > 0 && !hiddenReplies[comment._id] && (
            <View style={styles.repliesContainer}>
              {comment.replies.map(reply => renderComment(reply, true, comment._id))}
            </View>
          )}

          {/* Show more replies button if any */}
          {comment.repliesCount && (!comment.replies || comment.replies.length < comment.repliesCount) && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={async () => {
                try {
                  const res = await api.getCommentReplies(comment._id, 0, 50, token || undefined) as any;
                  setComments(prev => prev.map(c => {
                    if (c._id === comment._id) {
                      return { ...c, replies: res.data || res };
                    }
                    return c;
                  }));
                  // Ensure they are not hidden when loading more
                  if (hiddenReplies[comment._id]) {
                    toggleHiddenReplies(comment._id);
                  }
                } catch (e) {
                  console.log('Error loading replies:', e);
                }
              }}
            >
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                {hiddenReplies[comment._id]
                  ? `Show ${comment.repliesCount} replies`
                  : `View ${comment.repliesCount - (comment.replies?.length || 0)} more replies`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Post',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerTitle: 'Post',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.textSecondary }}>Post not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Post',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        {/* Post Header */}
        {post.author && (
          <View style={styles.postHeader}>
            <TouchableOpacity onPress={() => router.push(`/user/${post.author._id}`)}>
              <Image
                source={{ uri: post.author.avatar || '' }}
                style={styles.avatar}
                contentFit="cover"
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.userInfo}
              onPress={() => router.push(`/user/${post.author._id}`)}
            >
              <View style={styles.nameContainer}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {post.author.name || 'Unknown User'}
                </Text>
                {post.author.isVerified && (
                  <BadgeCheck size={16} color="#FFFFFF" fill={colors.primary} />
                )}
              </View>
              <Text style={[styles.role, { color: colors.textSecondary }]}>
                {post.author.roles?.slice(0, 2).join(' • ')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleMoreOptions} style={styles.moreButton}>
              <MoreVertical size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Post Media */}
        {renderMedia()}

        {/* Post Caption */}
        <View style={styles.postContent}>
          <Text style={[styles.caption, { color: colors.text }]}>
            {post.caption}
          </Text>
          <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
            {new Date(post.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Post Actions */}
        <View style={[styles.actions, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.action} onPress={handleLike}>
            <Heart
              size={22}
              color={isLiked ? colors.error : colors.textSecondary}
              fill={isLiked ? colors.error : 'transparent'}
            />
            <Text style={[styles.actionText, { color: colors.textSecondary }]}>
              {likesCount}
            </Text>
          </TouchableOpacity>



          <TouchableOpacity style={styles.action} onPress={handleShare}>
            <Share2 size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={[styles.commentsTitle, { color: colors.text }]}>
            Comments ({post.engagement?.commentsCount || comments.length})
          </Text>

          {comments
            .filter((comment) => comment.user && !comment.parentComment) // Filter top-level comments
            .map((comment) => (
              <View key={comment._id}>
                {renderComment(comment)}
              </View>
            ))}
        </View>
      </ScrollView>

      {/* Reply Banner */}
      {replyTo && (
        <View style={[styles.replyBanner, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
            Replying to <Text style={{ fontWeight: 'bold' }}>{replyTo.user.name}</Text>
          </Text>
          <TouchableOpacity onPress={() => setReplyTo(null)}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comment Input */}
      <View style={[
        styles.commentInputContainer,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 12)
        }
      ]}>
        <TextInput
          ref={commentInputRef}
          style={[styles.commentInput, { color: colors.text, backgroundColor: colors.surface }]}
          placeholder={replyTo ? `Reply to ${replyTo.user.name}...` : "Add a comment..."}
          placeholderTextColor={colors.textSecondary}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            { backgroundColor: commentText.trim() ? colors.primary : colors.border },
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  mediaContainer: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPlayButton: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    padding: 8,
  },
  replyItem: {
    marginTop: 12,
    marginBottom: 4,
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  commentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 16,
  },
  footerAction: {
    paddingVertical: 4,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  repliesContainer: {
    marginTop: 8,
  },
  showMoreButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  replyText: {
    fontSize: 12,
    flex: 1,
  },
  audioCard: {
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  audioProgress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    minWidth: 35,
  },
  scriptCard: {
    padding: 24,
    marginHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  genericScriptCard: {
    alignItems: 'center',
    gap: 12,
  },
  scriptIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scriptTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  scriptSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  audioContainer: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioText: {
    fontSize: 16,
    fontWeight: '600',
  },
  postContent: {
    padding: 16,
    paddingTop: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentsSection: {
    padding: 16,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
  },
  commentText: {
    fontSize: 14,
    lineHeight: 18,
  },
  commentTime: {
    fontSize: 12,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
