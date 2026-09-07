import React, { useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { Image, type ImageProps } from 'expo-image';
import { Skeleton } from '@/components/skeletons/Skeleton';
import { cloudinaryImage } from '@/utils/cloudinary';

interface RemoteImageProps {
  uri?: string | null;
  /** Rendered width in points. Sizes the copy requested from Cloudinary. */
  requestWidth: number;
  /** Rendered height in points. Only needed when cropping to a fixed box. */
  requestHeight?: number;
  /** `limit` never upscales (default); `fill` crops to the exact box. */
  crop?: 'limit' | 'fill';
  contentFit?: ImageProps['contentFit'];
  /** Sizes the wrapper. The image and the shimmer both fill it. */
  style?: StyleProp<ViewStyle>;
  /** Match the wrapper's corners, so a circular avatar is not a square shimmer. */
  borderRadius?: number;
  transition?: number;
  onError?: () => void;
}

/**
 * A remote image that shows the app's skeleton shimmer until it has pixels, and
 * asks Cloudinary for a copy sized to where it is rendered.
 *
 * The two halves work together: the shimmer stops a loading photo reading as a
 * broken black box, and the right-sized request means it is only on screen for
 * a moment rather than for a whole full-resolution download.
 */
export default function RemoteImage({
  uri,
  requestWidth,
  requestHeight,
  crop = 'limit',
  contentFit = 'cover',
  style,
  borderRadius = 0,
  transition = 200,
  onError,
}: RemoteImageProps) {
  const source = cloudinaryImage(uri, { width: requestWidth, height: requestHeight, crop });
  // Tracking which source finished, rather than a plain boolean, means a
  // recycled row that swaps to a different photo shows the shimmer again
  // instead of inheriting the previous row's finished state.
  const [loadedSource, setLoadedSource] = useState<string | undefined>();
  // No source at all is not a load in progress — there is nothing coming.
  const isLoading = !!source && loadedSource !== source;

  return (
    <View style={[styles.container, style]}>
      {isLoading && (
        <Skeleton
          width="100%"
          height="100%"
          borderRadius={borderRadius}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <Image
        source={source ? { uri: source } : undefined}
        style={StyleSheet.absoluteFillObject}
        contentFit={contentFit}
        transition={transition}
        // Clears the previous photo when a recycled row changes source, rather
        // than holding it on screen underneath the incoming one.
        recyclingKey={source}
        // Fires on success and on failure alike, so a broken image cannot leave
        // the shimmer pulsing forever.
        onLoadEnd={() => setLoadedSource(source)}
        onError={onError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
});
