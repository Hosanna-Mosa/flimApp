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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
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
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  
  console.log('[PostDetail] Current user:', user ? `${user.name} (${(user as any)._id || user.id})` : 'Not logged in');
  
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  
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
        console.log('[PostDetail] Screen focused - refreshing post data');
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
      
      console.log('[PostDetail] Post data received:', {
        isLiked: postData.isLiked,
        likesCount: postData.engagement?.likesCount,
        postId: postData._id
      });
      
      setPost(postData);
      setIsLiked(postData.isLiked || false);
      setLikesCount(postData.engagement?.likesCount || 0);
      setComments(commentsData.data || []);
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
      console.error('[PostDetail] Like error:', error);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    
    try {
      setSubmitting(true);
      const result = await api.addComment(id, commentText.trim(), undefined, token || undefined) as any;
      
      // Add new comment to the list
      setComments(prev => [result.data, ...prev]);
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
      console.error('[PostDetail] Comment error:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
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
      console.error('[PostDetail] Share error:', error);
    }
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
                  <BadgeCheck size={16} color={colors.primary} fill="transparent" />
                )}
              </View>
              <Text style={[styles.role, { color: colors.textSecondary }]}>
                {post.author.roles?.slice(0, 2).join(' • ')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Post Media */}
        {(post.type === 'image' || post.type === 'video') && post.mediaUrl && (
          <Image
            source={{ uri: post.thumbnailUrl || post.mediaUrl }}
            style={styles.media}
            contentFit="cover"
          />
        )}

        {post.type === 'audio' && (
          <View style={[styles.audioContainer, { backgroundColor: colors.surface }]}>
            <Music size={48} color={colors.primary} />
            <Text style={[styles.audioText, { color: colors.text }]}>Audio Track</Text>
          </View>
        )}

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
            Comments ({comments.length})
          </Text>
          
          {comments
            .filter((comment) => comment.user) // Filter out comments with null users
            .map((comment) => (
            <View key={comment._id} style={styles.commentItem}>
              <Image
                source={{ uri: comment.user?.avatar || '' }}
                style={styles.commentAvatar}
                contentFit="cover"
              />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentUserName, { color: colors.text }]}>
                    {comment.user?.name || 'Unknown User'}
                  </Text>
                  {comment.user?.isVerified && (
                    <BadgeCheck size={12} color={colors.primary} fill="transparent" />
                  )}
                </View>
                <Text style={[styles.commentText, { color: colors.text }]}>
                  {comment.content}
                </Text>
                <Text style={[styles.commentTime, { color: colors.textSecondary }]}>
                  {new Date(comment.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

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
          style={[styles.commentInput, { color: colors.text, backgroundColor: colors.surface }]}
          placeholder="Add a comment..."
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
    height: 400,
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
