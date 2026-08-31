import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAX_PAGES = 20;

interface PdfCarouselProps {
  /** Cloudinary PDF URL (…/upload/…/file.pdf). */
  url: string;
  /** Page count from media metadata; defaults to 3 for legacy uploads. */
  pages?: number;
}

/**
 * Builds per-page JPG URLs for a Cloudinary-hosted PDF, or null when the URL
 * is not a Cloudinary upload (no page rendering available).
 */
export function getPdfPageUrls(url: string, pages: number): string[] | null {
  const baseUrl = url.replace(/\.pdf$/i, '.jpg');
  const uploadIndex = baseUrl.indexOf('/upload/');
  if (uploadIndex === -1) return null;
  const prefix = baseUrl.substring(0, uploadIndex + 8);
  const suffix = baseUrl.substring(uploadIndex + 8);
  const urls: string[] = [];
  for (let i = 1; i <= Math.min(pages, MAX_PAGES); i++) {
    urls.push(`${prefix}pg_${i}/${suffix}`);
  }
  return urls;
}

/** LinkedIn-style horizontal, paged carousel of PDF page images. */
export default function PdfCarousel({ url, pages = 3 }: PdfCarouselProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageUrls = getPdfPageUrls(url, pages) ?? [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    setCurrentPage(Math.round(offsetX / SCREEN_WIDTH) + 1);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={pageUrls}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <View style={styles.page}>
            <Image source={{ uri: item }} style={styles.pageImage} contentFit="contain" transition={200} />
          </View>
        )}
      />
      <View style={styles.overlayBottom}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {currentPage} {pages > 1 ? `/ ${pages}` : ''}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 500,
    position: 'relative',
    backgroundColor: '#333',
  },
  page: {
    width: SCREEN_WIDTH,
    height: 500,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
