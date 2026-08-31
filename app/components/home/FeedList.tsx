import React, { useRef, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Post } from '@/types';
import FeedPost from '@/components/FeedPost';
import EmptyState from '@/components/ui/EmptyState';
import ListFooterLoader from '@/components/ui/ListFooterLoader';

interface FeedListProps {
  posts: Post[];
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  loadingMore: boolean;
  onLike: (postId: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onSave?: (postId: string) => void;
  /** Follow wiring (home feed only). */
  isFollowing?: (userId: string) => boolean;
  onFollow?: (userId: string) => void;
  /** Re-render rows when this changes (e.g. the followingIds Set). */
  extraData?: unknown;
  /** When set, an EmptyState is rendered inside the list for zero posts. */
  emptyTitle?: string;
  emptySubtitle?: string;
  /** Extra space under the last post (e.g. to clear a floating bar). */
  bottomPadding?: number;
}

/**
 * Vertical list of FeedPost cards with pull-to-refresh, infinite scroll and
 * viewability tracking so only the most visible post plays media.
 */
export default function FeedList({
  posts,
  refreshing,
  onRefresh,
  onEndReached,
  loadingMore,
  onLike,
  onComment,
  onShare,
  onSave,
  isFollowing,
  onFollow,
  extraData,
  emptyTitle,
  emptySubtitle,
  bottomPadding,
}: FeedListProps) {
  const { colors } = useTheme();
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    // The first viewable item is the one we treat as "active"
    const mostVisibleItem = viewableItems[0];
    if (mostVisibleItem) {
      setActivePostId(mostVisibleItem.item.id);
    }
  }).current;

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      data={posts}
      keyExtractor={(item) => item.id}
      extraData={extraData}
      renderItem={({ item }) => (
        <FeedPost
          post={item}
          isFollowing={isFollowing ? isFollowing(item.user.id) : undefined}
          onFollow={onFollow}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
          onSave={onSave}
          isActive={activePostId === item.id}
        />
      )}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      contentContainerStyle={bottomPadding !== undefined ? { paddingBottom: bottomPadding } : undefined}
      ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
      ListEmptyComponent={
        emptyTitle ? <EmptyState title={emptyTitle} subtitle={emptySubtitle} style={styles.empty} /> : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    paddingTop: 100,
  },
});
