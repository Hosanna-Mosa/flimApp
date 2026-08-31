import React from 'react';
import Screen from '@/components/layout/Screen';
import HomeHeaderTitle from '@/components/home/HomeHeaderTitle';
import HomeHeaderActions from '@/components/home/HomeHeaderActions';
import FeedSkeletonList from '@/components/home/FeedSkeletonList';
import FeedList from '@/components/home/FeedList';
import { useFeed } from '@/hooks/useFeed';
import { useFollow } from '@/hooks/useFollow';
import { usePostActions } from '@/hooks/usePostActions';

export default function HomeScreen() {
  const follow = useFollow();
  const feed = useFeed({ follow });
  const { handleLike, handleComment, handleShare, handleSave } = usePostActions(feed.posts, feed.setPosts);

  return (
    <Screen
      headerShown
      headerTitle={() => <HomeHeaderTitle />}
      headerTitleAlign="left"
      headerRight={() => <HomeHeaderActions />}
      scroll={feed.showSkeleton}
      padded={false}
      refreshing={feed.refreshing}
      onRefresh={feed.onRefresh}
    >
      {feed.showSkeleton ? (
        <FeedSkeletonList />
      ) : (
        <FeedList
          posts={feed.posts}
          extraData={follow.followingIds}
          isFollowing={follow.isFollowing}
          onFollow={follow.toggleFollow}
          onLike={handleLike}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
          refreshing={feed.refreshing}
          onRefresh={feed.onRefresh}
          onEndReached={feed.loadMore}
          loadingMore={feed.loadingMore}
          emptyTitle="No posts yet"
          emptySubtitle="Follow some users to see their posts!"
        />
      )}
    </Screen>
  );
}
