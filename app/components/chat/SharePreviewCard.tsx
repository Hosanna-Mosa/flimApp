import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Link2, Video } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IncomingShare } from '@/utils/shareIntent';

interface SharePreviewCardProps {
  share: IncomingShare;
}

const THUMBS_SHOWN = 4;

const describe = (share: IncomingShare) => {
  const { files } = share;
  if (files.length === 0) return share.webUrl ? 'Link' : 'Text';

  const videos = files.filter((f) => f.kind === 'video').length;
  const images = files.length - videos;
  if (videos === 0) return images === 1 ? 'Photo' : `${images} photos`;
  if (images === 0) return videos === 1 ? 'Video' : `${videos} videos`;
  return `${files.length} items`;
};

/**
 * What is about to be shared, shown above the list of people to send it to.
 *
 * Sharing is a blind hand-off — the user tapped through another app's share
 * sheet and lands here — so the first thing this screen has to answer is
 * "did the right thing come across?".
 */
export default function SharePreviewCard({ share }: SharePreviewCardProps) {
  const { colors } = useTheme();
  const hasFiles = share.files.length > 0;
  const overflow = share.files.length - THUMBS_SHOWN;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        Sharing · {describe(share)}
      </Text>

      {hasFiles ? (
        <View style={styles.thumbs}>
          {share.files.slice(0, THUMBS_SHOWN).map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.thumbWrap}>
              {/* A video's first frame is what expo-image renders here on
                  Android; on iOS it falls back to the placeholder colour, and
                  the badge is what identifies it either way. */}
              <Image source={{ uri: file.uri }} style={styles.thumb} contentFit="cover" />
              {file.kind === 'video' && (
                <View style={styles.videoBadge}>
                  <Video size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
          ))}
          {overflow > 0 && (
            <View style={[styles.more, { backgroundColor: colors.background }]}>
              <Text style={[styles.moreText, { color: colors.text }]}>+{overflow}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.textRow}>
          {!!share.webUrl && <Link2 size={16} color={colors.textSecondary} />}
          <Text style={[styles.text, { color: colors.text }]} numberOfLines={3}>
            {share.text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  thumbs: { flexDirection: 'row', gap: 8 },
  thumbWrap: { width: 62, height: 62 },
  thumb: { width: 62, height: 62, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.12)' },
  videoBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  more: {
    width: 62,
    height: 62,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: { fontSize: 15, fontWeight: '600' },
  textRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  text: { flex: 1, fontSize: 14, lineHeight: 20 },
});
