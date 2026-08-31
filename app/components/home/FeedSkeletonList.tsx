import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FeedSkeleton } from '@/components/skeletons/FeedSkeleton';

interface FeedSkeletonListProps {
  count?: number;
  /** Fill the parent (use when the skeleton is the whole non-scrolling body). */
  fill?: boolean;
}

/** Initial-load placeholder for any FeedPost list. */
export default function FeedSkeletonList({ count = 3, fill = false }: FeedSkeletonListProps) {
  return (
    <View style={[styles.container, fill && styles.fill]}>
      {Array.from({ length: count }, (_, i) => (
        <FeedSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  fill: {
    flex: 1,
  },
});
