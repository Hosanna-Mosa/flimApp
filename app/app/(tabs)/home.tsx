import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
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
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { mockPosts } from '@/mocks/posts';
import { Post } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [following, setFollowing] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(mockPosts.map(({ user }) => [user.id, false]))
  );

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setPosts([...mockPosts]);
      setRefreshing(false);
    }, 1000);
  };

  const toggleFollow = (userId: string) => {
    setFollowing((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleLike = (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
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
              <TouchableOpacity onPress={() => router.push('/trending')}>
                <Flame size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Bell size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/messages')}>
                <MessageCircle size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
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
              <Image
                source={{ uri: post.user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.userInfo}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {post.user.name}
                </Text>
                <Text style={[styles.role, { color: colors.textSecondary }]}>
                  {post.user.roles.slice(0, 2).join(' • ')}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  {
                    backgroundColor: following[post.user.id]
                      ? `${colors.primary}20`
                      : colors.primary,
                    borderColor: following[post.user.id]
                      ? colors.primary
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleFollow(post.user.id)}
              >
                <Text
                  style={[
                    styles.followButtonText,
                    {
                      color: following[post.user.id] ? colors.primary : '#fff',
                    },
                  ]}
                >
                  {following[post.user.id] ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
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

              <TouchableOpacity style={styles.action}>
                <MessageSquare size={22} color={colors.textSecondary} />
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  {post.comments}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.action}>
                <Share2 size={22} color={colors.textSecondary} />
                <Text
                  style={[styles.actionText, { color: colors.textSecondary }]}
                >
                  {post.shares}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
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
  followButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  followButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
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
