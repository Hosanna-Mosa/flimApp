import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import MediaTypeIcon from '@/components/ui/MediaTypeIcon';
import RankBadge from '@/components/trending/RankBadge';
import { TrendingPost } from '@/hooks/useTrending';

interface TrendingItemCardProps {
  post: TrendingPost;
  /** 1-based position in the list. */
  rank: number;
  onPress: () => void;
}

/** Thumbnail + caption + type/likes row for one trending post. */
export default function TrendingItemCard({ post, rank, onPress }: TrendingItemCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <RankBadge rank={rank} />

      <Image source={{ uri: post.thumbnailUrl || post.mediaUrl }} style={styles.thumbnail} contentFit="cover" />

      <View style={styles.info}>
        <Text style={[styles.caption, { color: colors.text }]} numberOfLines={2}>
          {post.caption}
        </Text>
        <View style={styles.meta}>
          <MediaTypeIcon type={post.type} />
          <Text style={[styles.likes, { color: colors.textSecondary }]}>{post.likes} Likes</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 100,
  },
  thumbnail: {
    width: 100,
    height: '100%',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 16,
    fontWeight: '600',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likes: {
    fontSize: 14,
  },
});
