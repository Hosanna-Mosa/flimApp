import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { useTheme } from '@/contexts/ThemeContext';
import type { PostMediaVariant } from './PostVideoPlayer';

interface PostScriptCardProps {
  /** Document URL. When missing the card is rendered as "unavailable". */
  url?: string;
  variant?: PostMediaVariant;
}

/** Generic document card for non-PDF scripts: tap to open in the browser. */
export default function PostScriptCard({ url, variant = 'feed' }: PostScriptCardProps) {
  const { colors } = useTheme();
  const isDetail = variant === 'detail';

  const body = (
    <View style={[styles.body, !isDetail && styles.bodyFeed]}>
      <View style={[styles.icon, isDetail ? styles.iconDetail : styles.iconFeed]}>
        <FileText size={48} color={colors.primary} />
      </View>
      <Text style={[isDetail ? styles.titleDetail : styles.titleFeed, { color: colors.text }]}>
        {url ? 'Document' : 'Document unavailable'}
      </Text>
      {!!url && (
        <Text style={[isDetail ? styles.subtitleDetail : styles.subtitleFeed, { color: colors.primary }]}>
          Tap to Open
        </Text>
      )}
    </View>
  );

  const cardStyle = [isDetail ? styles.cardDetail : styles.cardFeed, { backgroundColor: colors.surface }];

  if (!url) return <View style={cardStyle}>{body}</View>;
  return (
    <TouchableOpacity style={cardStyle} onPress={() => WebBrowser.openBrowserAsync(url)}>
      {body}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardFeed: {
    width: '100%',
    minHeight: 250,
  },
  cardDetail: {
    padding: 24,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  body: {
    alignItems: 'center',
    gap: 12,
  },
  bodyFeed: {
    flex: 1,
    justifyContent: 'center',
    height: 250,
  },
  icon: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 40,
  },
  iconFeed: {
    padding: 16,
  },
  iconDetail: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleFeed: {
    fontSize: 18,
    fontWeight: '700',
  },
  titleDetail: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitleFeed: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  subtitleDetail: {
    fontSize: 14,
    fontWeight: '500',
  },
});
