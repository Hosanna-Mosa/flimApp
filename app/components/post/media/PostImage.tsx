import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import RemoteImage from '@/components/ui/RemoteImage';
import type { PostMediaVariant } from './PostVideoPlayer';

/** Feed and detail cards are both full-bleed, so this is the widest it renders. */
const SCREEN_WIDTH = Dimensions.get('window').width;

interface PostImageProps {
  url: string;
  aspectRatio: number;
  variant?: PostMediaVariant;
}

/** Full-width image sized by its intrinsic aspect ratio on a black ground. */
export default function PostImage({ url, aspectRatio, variant = 'feed' }: PostImageProps) {
  const minHeight = variant === 'detail' ? 300 : 200;
  return (
    <RemoteImage
      uri={url}
      requestWidth={SCREEN_WIDTH}
      contentFit="cover"
      style={[styles.container, { aspectRatio, minHeight }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
  },
});
