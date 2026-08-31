import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { PostMediaVariant } from './PostVideoPlayer';

interface PostImageProps {
  url: string;
  aspectRatio: number;
  variant?: PostMediaVariant;
}

/** Full-width image sized by its intrinsic aspect ratio on a black ground. */
export default function PostImage({ url, aspectRatio, variant = 'feed' }: PostImageProps) {
  const minHeight = variant === 'detail' ? 300 : 200;
  return (
    <View style={[styles.container, { aspectRatio, minHeight }]}>
      <Image source={{ uri: url }} style={[styles.media, { minHeight }]} contentFit="cover" transition={200} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
});
