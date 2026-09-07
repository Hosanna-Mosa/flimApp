import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Type, Image as ImageIcon } from 'lucide-react-native';
import RemoteImage from '@/components/ui/RemoteImage';
import { useTheme } from '@/contexts/ThemeContext';
import { UserPost } from '@/types';

const { width } = Dimensions.get('window');
/** Three tiles across, edge to edge. */
export const POST_TILE_SIZE = width / 3;

interface PostThumbnailProps {
  post: UserPost;
  onPress: () => void;
}

/**
 * One square tile in a profile grid: the post's thumbnail, a caption
 * preview for text posts, or an image placeholder when the media fails.
 */
export default function PostThumbnail({ post, onPress }: PostThumbnailProps) {
  const { colors } = useTheme();
  const [hasError, setHasError] = useState(false);

  return (
    <TouchableOpacity
      style={[styles.tile, { width: POST_TILE_SIZE, height: POST_TILE_SIZE }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {post.type === 'text' ? (
        <View style={[styles.placeholder, styles.textTile, { backgroundColor: colors.surface }]}>
          <Type size={32} color={colors.primary} style={styles.textIcon} />
          <Text numberOfLines={3} style={[styles.caption, { color: colors.text }]}>
            {post.caption}
          </Text>
        </View>
      ) : !hasError ? (
        <RemoteImage
          uri={post.media?.thumbnail || post.thumbnailUrl || post.media?.url || post.mediaUrl}
          // Square tile, so crop to it rather than fetching the whole photo.
          requestWidth={POST_TILE_SIZE}
          requestHeight={POST_TILE_SIZE}
          crop="fill"
          contentFit="cover"
          style={styles.image}
          onError={() => setHasError(true)}
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
          <ImageIcon size={32} color={colors.textSecondary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textTile: {
    padding: 8,
  },
  textIcon: {
    marginBottom: 4,
  },
  caption: {
    fontSize: 10,
    textAlign: 'center',
  },
});
