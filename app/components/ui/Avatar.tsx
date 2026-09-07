import React from 'react';
import { StyleProp, ViewStyle, ImageStyle } from 'react-native';
import RemoteImage from '@/components/ui/RemoteImage';
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
    <RemoteImage
      uri={getAvatarUrl(uri)}
      // Avatars are small and always square, so crop to the exact circle rather
      // than shipping a wide photo the view will only ever show the middle of.
      requestWidth={size}
      requestHeight={size}
      crop="fill"
      contentFit="cover"
      borderRadius={size / 2}
      style={[{ width: size, height: size, borderRadius: size / 2 }, style as StyleProp<ViewStyle>]}
    />
  );
}
