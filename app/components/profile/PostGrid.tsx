import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import EmptyState from '@/components/ui/EmptyState';
import PostThumbnail from '@/components/profile/PostThumbnail';
import { UserPost } from '@/types';

interface PostGridProps {
  posts: UserPost[];
  /** Shown when `posts` is empty. */
  emptyTitle: string;
  /** Tap handler per post; defaults to opening the post detail screen. */
  onPressPost?: (post: UserPost) => void;
}

/** Three-column grid of a user's posts, with an inline empty state. */
export default function PostGrid({ posts, emptyTitle, onPressPost }: PostGridProps) {
  const router = useRouter();
  const handlePress = onPressPost ?? ((post: UserPost) => router.push(`/post/${post._id}`));

  return (
    <View style={styles.grid}>
      {posts.map((post) => (
        <PostThumbnail key={post._id} post={post} onPress={() => handlePress(post)} />
      ))}
      {posts.length === 0 && <EmptyState title={emptyTitle} style={styles.empty} />}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  empty: {
    width: '100%',
  },
});
