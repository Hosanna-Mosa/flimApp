import React from 'react';
import { StyleProp, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { getAvatarUrl } from '@/utils/avatar';

interface AvatarProps {
  /** Remote avatar URL; falls back to the app-wide default when empty. */
  uri?: string | null;
  /** Reserved for a future per-user fallback; not read today. */
  userId?: string;
  /** Reserved for a future per-user fallback; not read today. */
  name?: string;
  /** Diameter in px. */
  size: number;
  style?: StyleProp<ImageStyle>;
}

/**
 * The one way to render a user avatar: circular, sized by a single prop,
 * with the shared fallback strategy from utils/avatar.
 */
export default function Avatar({ uri, size, style }: AvatarProps) {
  return (
    <Image
      source={{ uri: getAvatarUrl(uri) }}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style]}
      contentFit="cover"
    />
  );
}
