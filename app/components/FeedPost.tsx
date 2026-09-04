import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, Zap } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '@/types';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDateTime } from '@/utils/date';
import { ReportButton } from './ReportButton';
import Avatar from '@/components/ui/Avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';
import PostMedia from '@/components/post/media/PostMedia';

interface FeedPostProps {
  post: Post;
  /** Omit onFollow to hide the follow button (e.g. saved / crowd-fund lists). */
  isFollowing?: boolean;
  onFollow?: (userId: string) => void;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onSave?: (postId: string) => void;
  /** Whether this post is the one currently in view (drives video/audio autoplay). */
  isActive: boolean;
}

export default function FeedPost({
  post,
  isFollowing,
  onFollow,
  onLike,
  onComment,
  onShare,
  onSave,
  isActive,
}: FeedPostProps) {
  const router = useRouter();
  const { colors } = useTheme();

  const mediaUrl = post.media?.url || post.mediaUrl;
  const hasMedia = !!mediaUrl || post.type === 'audio';

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.divider }]}>
      {/* Header: avatar · name · role · follow · menu */}
      {post.user && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.userInfo}
            onPress={() => router.push({ pathname: '/user/[id]', params: { id: post.user.id } })}
          >
            <Avatar uri={post.user.avatar} userId={post.user.id} name={post.user.name} size={36} />
            <View style={styles.headerText}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                  {post.user.name}
                </Text>
                <VerifiedBadge visible={post.user.isBadgeVerified} size={14} />
                {post.user.isBoosted && Platform.OS !== 'ios' && (
                  <View style={[styles.boostedBadge, { backgroundColor: colors.primary }]}>
                    <Zap size={10} color={colors.onPrimary} fill={colors.onPrimary} />
                    <Text style={[styles.boostedText, { color: colors.onPrimary }]}>BOOSTED</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.role, { color: colors.textSecondary }]} numberOfLines={1}>
                {post.user.roles?.[0] || 'Member'}
              </Text>
            </View>
          </TouchableOpacity>

          {onFollow && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                isFollowing
                  ? { backgroundColor: 'transparent', borderColor: colors.border }
                  : { backgroundColor: colors.link, borderColor: colors.link },
              ]}
              onPress={() => onFollow(post.user.id)}
            >
              <Text style={[styles.followText, { color: isFollowing ? colors.text : '#FFFFFF' }]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}

          <ReportButton type="post" id={post.id} />
        </View>
      )}

      {/* Media: full-bleed */}
      {hasMedia && (
        <View style={styles.mediaWrap}>
          <PostMedia source={post} audioId={post.id} isActive={isActive} variant="feed" />
        </View>
      )}

      {/* Actions: like · comment · share ··· save */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onLike(post.id)} hitSlop={8}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={post.isLiked ? colors.error : colors.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onComment(post.id)} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(post.id)} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.spacer} />
        {onSave && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onSave(post.id)} hitSlop={8}>
            <Bookmark
              size={24}
              color={post.isSaved ? colors.primary : colors.text}
              fill={post.isSaved ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Likes · caption · comments · time */}
      <View style={styles.content}>
        {post.likes > 0 && (
          <Text style={[styles.likesText, { color: colors.text }]}>
            {post.likes} {post.likes === 1 ? 'like' : 'likes'}
          </Text>
        )}
        {!!post.caption && (
          <Text style={[styles.caption, { color: colors.text }]}>
            <Text style={styles.captionName}>{post.user?.name} </Text>
            {post.caption}
          </Text>
        )}
        {post.comments > 0 && (
          <TouchableOpacity onPress={() => onComment(post.id)}>
            <Text style={[styles.viewComments, { color: colors.textSecondary }]}>
              View {post.comments === 1 ? '1 comment' : `all ${post.comments} comments`}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
          {post.createdAt ? formatDateTime(post.createdAt) : 'Just now'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  headerText: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  role: {
    fontSize: 12,
    marginTop: 1,
  },
  followBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  followText: {
    fontSize: 13,
    fontWeight: '600',
  },
  mediaWrap: {
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 12,
    gap: 4,
  },
  likesText: {
    fontSize: 14,
    fontWeight: '600',
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  captionName: {
    fontWeight: '600',
  },
  viewComments: {
    fontSize: 14,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  boostedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    gap: 2,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
