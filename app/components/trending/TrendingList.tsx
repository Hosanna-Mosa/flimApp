import React from 'react';
import { View } from 'react-native';
import { TrendingSkeleton } from '@/components/skeletons/TrendingSkeleton';
import TrendingItemCard from '@/components/trending/TrendingItemCard';
import { TrendingPost } from '@/hooks/useTrending';

interface TrendingListProps {
  posts: TrendingPost[];
  /** Shows five skeleton rows instead of the cards. */
  loading: boolean;
  onPressPost: (post: TrendingPost) => void;
}

/** Ranked list of trending posts (or skeletons while loading). */
export default function TrendingList({ posts, loading, onPressPost }: TrendingListProps) {
  if (loading) {
    return (
      <View>
        {[1, 2, 3, 4, 5].map((i) => (
          <TrendingSkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <>
      {posts.map((post, index) => (
        <TrendingItemCard key={post.id} post={post} rank={index + 1} onPress={() => onPressPost(post)} />
      ))}
    </>
  );
}
