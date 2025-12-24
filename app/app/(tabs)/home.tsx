import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Animated,
  Share,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import {
  MessageCircle,
  Heart,
  Share2,
  MessageSquare,
  Film,
  Play,
  Music,
  FileText,
  Flame,
  Bell,
  Plus,
  Check,
  BadgeCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { Post } from '@/types';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// Separate component to handle follow animation logic
const FollowButton = ({ 
  userId, 
  isFollowing, 
  onPress, 
  primaryColor, 
  borderColor 
}: { 
  userId: string; 
  isFollowing: boolean; 
  onPress: () => void; 
  primaryColor: string; 
  borderColor: string;
}) => {
  // Use a ref to track if it's the initial render
  const isInitialMount = React.useRef(true);
  const [visible, setVisible] = useState(!isFollowing);
  const [showTick, setShowTick] = useState(false);
  
  // Animation value for opacity
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // If already following on mount, don't show anything
      if (isFollowing) {
        setVisible(false);
      }
      return;
    }

    if (isFollowing) {
      // User just followed: Show tick, then hide
      setShowTick(true);
      
      // Animate out after delay
      Animated.sequence([
        Animated.delay(1000), // Show tick for 1 second
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setVisible(false);
        setShowTick(false);
      });
    } else {
      // User unfollowed: Show plus again
      setVisible(true);
      setShowTick(false);
      fadeAnim.setValue(1);
    }
  }, [isFollowing]);

  if (!visible) return null;

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.followBadge,
        {
          backgroundColor: showTick ? borderColor : primaryColor,
          opacity: fadeAnim,
        },
      ]}
      onPress={onPress}
      disabled={showTick} // Disable press while showing success tick
    >
      {showTick ? (
        <Check size={10} color="#000" />
      ) : (
        <Plus size={10} color="#fff" />
      )}
    </AnimatedTouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token, isLoading: authLoading } = useAuth(); // token is directly available
  const [posts, setPosts] = useState<Post[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load feed and following list when token changes
  useEffect(() => {
    if (!authLoading && token && user) {
      loadData();
    }
  }, [token, authLoading, user]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchFollowingList(), loadFeed()]);
    setLoading(false);
  };

  const fetchFollowingList = async () => {
    if (!user || !token) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = user.id || (user as any)._id;
      if (!userId) {
        console.error('[Home] User ID missing', user);
        return;
      }

      // Fetch a large number of following users to build the local source of truth
      // In a real app with thousands of follows, we might need a dedicated endpoint for just IDs
      const result = await api.getFollowing(userId, 0, 1000, token);
      
      if (result && Array.isArray(result.data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawIds = result.data.map((u: any) => u._id || u.id);
        const ids = new Set(rawIds);
        setFollowingIds(ids);
        console.log('[Home] Following IDs:', Array.from(ids));
      }
    } catch (error) {
      console.error('[Home] Error fetching following list:', error);
    }
  };

  const loadFeed = async () => {
    if (!token) return;
    
    try {
      console.log('[Home] Loading feed...');
      const result = await api.getFeed(0, 20, 'hybrid', 7, token);
      
      if (result.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedPosts = result.data.map((p: any) => ({
          id: p._id,
          userId: p.author._id,
          user: {
            id: p.author._id,
            name: p.author.name,
            avatar: p.author.avatar,
            isVerified: p.author.isVerified,
            roles: p.author.roles || [],
            isFollowing: p.author.isFollowing || false, // Will be overridden by Set check in render
          },
          type: p.type,
          mediaUrl: p.mediaUrl,
          thumbnailUrl: p.thumbnailUrl,
          caption: p.caption,
          likes: p.engagement?.likesCount || 0,
          comments: p.engagement?.commentsCount || 0,
          shares: p.engagement?.sharesCount || 0,
          isLiked: p.isLiked || false,
          createdAt: new Date(p.createdAt).toLocaleDateString(),
        }));
        
        setPosts(mappedPosts);
      }
    } catch (error) {
      console.error('[Home] Error loading feed:', error);
      Alert.alert('Error', 'Failed to load feed');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFollowingList(), loadFeed()]);
    setRefreshing(false);
  };

  const toggleFollow = async (userId: string) => {
    try {
      const isCurrentlyFollowing = followingIds.has(userId);
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Optimistic update of the Set
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlyFollowing) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });

      if (isCurrentlyFollowing) {
        const result = await api.unfollowUser(userId, token);
        console.log('[Home] Unfollowed user:', result);
      } else {
        const result = await api.followUser(userId, token);
        console.log('[Home] Followed user:', result);
        
        if (result.status === 'pending') {
          Alert.alert('Follow Request Sent', 'This account is private. Your request is pending.');
          // Revert optimistic update if pending (since we are not technically "following" yet in the accepted sense)
          setFollowingIds(prev => {
             const next = new Set(prev);
             next.delete(userId);
             return next;
          });
        }
      }
    } catch (error) {
      // Revert on error
      setFollowingIds(prev => {
        const next = new Set(prev);
        if (followingIds.has(userId)) { // If it was originally following
           next.add(userId);
        } else {
           next.delete(userId);
        }
        return next;
      });
      console.error('[Home] Follow error:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleLike = async (postId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const wasLiked = post.isLiked;

      // Optimistic update
      setPosts(prevPosts => prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p
      ));

      // API call
      if (wasLiked) {
        const result = await api.unlikePost(postId, token);
        console.log('[Home] Unliked post:', result);
        
        // Update with real count from server
        setPosts(prevPosts => prevPosts.map((p) =>
          p.id === postId ? { ...p, likes: result.likesCount, isLiked: false } : p
        ));
      } else {
        const result = await api.likePost(postId, token);
        console.log('[Home] Liked post:', result);
        
        // Update with real count from server
        setPosts(prevPosts => prevPosts.map((p) =>
          p.id === postId ? { ...p, likes: result.likesCount, isLiked: true } : p
        ));
      }
    } catch (error) {
      // Revert on error - use the original state
      setPosts(prevPosts => prevPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            isLiked: !p.isLiked, // Toggle back
            likes: p.isLiked ? p.likes + 1 : p.likes - 1, // Revert count
          };
        }
        return p;
      }));
      console.error('[Home] Like error:', error);
      Alert.alert('Error', 'Failed to like post');
    }
  };

  const handleComment = (postId: string) => {
    // Navigate to post detail with comments
    router.push(`/post/${postId}`);
  };

  const handleShare = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const shareUrl = `https://filmy.app/post/${postId}`;
      const message = post.caption 
        ? `${post.caption}\n\n${shareUrl}`
        : shareUrl;

      await Share.share({
        message,
        url: shareUrl,
      });
    } catch (error) {
      console.error('[Home] Share error:', error);
    }
  };

  const renderMediaIcon = (type: Post['type']) => {
    const iconProps = { size: 20, color: colors.primary };
    switch (type) {
      case 'video':
        return <Play {...iconProps} />;
      case 'audio':
        return <Music {...iconProps} />;
      case 'script':
        return <FileText {...iconProps} />;
      default:
        return <Film {...iconProps} />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Filmy',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <TouchableOpacity 
                onPress={() => router.push('/trending')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Flame size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Bell size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/messages')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MessageCircle size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
            Loading feed...
          </Text>
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 16 }}>
            No posts yet. Follow some users to see their posts!
          </Text>
        </View>
      ) : (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {posts.map((post) => (
          <View
            key={post.id}
            style={[
              styles.postCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.postHeader}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: post.user.avatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <FollowButton
                  userId={post.user.id}
                  isFollowing={followingIds.has(post.user.id)}
                  onPress={() => toggleFollow(post.user.id)}
                  primaryColor={colors.primary}
                  borderColor={colors.border}
                />
              </View>
              <View style={styles.userInfo}>
                <TouchableOpacity onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.user.id } })} style={styles.nameContainer}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {post.user.name}
                  </Text>
                  {post.user.isVerified && (
                    <BadgeCheck size={16} color={colors.primary} fill="transparent" />
                  )}
                </TouchableOpacity>
                <Text style={[styles.role, { color: colors.textSecondary }]}>
                  {post.user.roles.slice(0, 2).join(' • ')}
                </Text>
              </View>
              <View
                style={[
                  styles.mediaBadge,
                  { backgroundColor: `${colors.primary}20` },
                ]}
              >
                {renderMediaIcon(post.type)}
              </View>
            </View>

            {(post.type === 'image' ||
              post.type === 'video' ||
              post.type === 'script') && (
                <Image
                  source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                  style={styles.media}
                  contentFit="cover"
                />
              )}

            {post.type === 'audio' && (
              <View
                style={[
                  styles.audioContainer,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Music size={48} color={colors.primary} />
                <Text style={[styles.audioText, { color: colors.text }]}>
                  Audio Track
                </Text>
              </View>
            )}

            <View style={styles.postContent}>
              <Text style={[styles.caption, { color: colors.text }]}>
                {post.caption}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                {post.createdAt}
              </Text>
            </View>

            <View style={[styles.actions, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={styles.action}
                onPress={() => handleLike(post.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={22}
                  color={post.isLiked ? colors.error : colors.textSecondary}
                  fill={post.isLiked ? colors.error : 'transparent'}
                />
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.action}
                onPress={() => handleComment(post.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MessageSquare size={22} color={colors.textSecondary} />
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  {post.comments}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.action}
                onPress={() => handleShare(post.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Share2 size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  postCard: {
    marginBottom: 16,
    borderBottomWidth: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  followBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff', // Or dynamic background color for bezel effect
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
    fontWeight: '600' as const,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    textTransform: 'capitalize',
  },

  mediaBadge: {
    padding: 8,
    borderRadius: 8,
  },
  media: {
    width: '100%',
    height: 300,
  },
  audioContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  audioText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  postContent: {
    padding: 16,
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
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
