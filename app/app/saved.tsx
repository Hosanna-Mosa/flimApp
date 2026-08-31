import React from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import EmptyState from '@/components/ui/EmptyState';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import FeedSkeletonList from '@/components/home/FeedSkeletonList';
import FeedList from '@/components/home/FeedList';
import { useSavedPosts } from '@/hooks/useSavedPosts';

export default function SavedPostsScreen() {
  const router = useRouter();
  const s = useSavedPosts();

  return (
    <Screen
      title="Saved Posts"
      scroll={false}
      padded={false}
      headerLeft={() => (
        <HeaderIconButton
          icon={ChevronLeft}
          size={28}
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ marginLeft: 8 }}
        />
      )}
    >
      <StatusBar style="light" />

      {s.showSkeleton ? (
        <FeedSkeletonList fill />
      ) : s.posts.length === 0 ? (
        <EmptyState title="No saved posts yet" variant="fullscreen" />
      ) : (
        <FeedList
          posts={s.posts}
          onLike={s.handleLike}
          onComment={s.handleComment}
          onShare={s.handleShare}
          onSave={s.handleUnsave}
          refreshing={s.refreshing}
          onRefresh={s.onRefresh}
          onEndReached={s.loadMore}
          loadingMore={s.loadingMore}
          bottomPadding={100}
        />
      )}
    </Screen>
  );
}
