import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { X, Video } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PendingAttachment } from '@/hooks/useChatAttachment';

interface AttachmentPreviewProps {
  attachment: PendingAttachment;
  uploading: boolean;
  progress: number;
  onRemove: () => void;
}

const mb = (bytes?: number) => (bytes ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : '');

/**
 * The chosen file, shown above the composer before it is sent.
 *
 * Without this the only feedback between picking a file and the message
 * appearing is nothing at all, which reads as the picker having failed — and
 * on a large video that silence lasts minutes.
 */
export default function AttachmentPreview({
  attachment,
  uploading,
  progress,
  onRemove,
}: AttachmentPreviewProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: attachment.uri }} style={styles.thumb} contentFit="cover" />
        {attachment.kind === 'video' && (
          <View style={styles.videoBadge}>
            <Video size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.meta}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {attachment.name}
        </Text>
        <Text style={[styles.sub, { color: colors.textSecondary }]}>
          {uploading ? `Uploading ${progress}%` : mb(attachment.size)}
        </Text>
        {uploading && (
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View
              style={[styles.fill, { width: `${Math.max(progress, 4)}%`, backgroundColor: colors.primary }]}
            />
          </View>
        )}
      </View>

      {/* Removing mid-upload would leave the request running with nothing to
          receive it, so the control is hidden until it finishes. */}
      {!uploading && (
        <TouchableOpacity onPress={onRemove} hitSlop={10} style={styles.remove}>
          <X size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    padding: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbWrap: { width: 46, height: 46 },
  thumb: { width: 46, height: 46, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.08)' },
  videoBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 14, fontWeight: '500' },
  sub: { fontSize: 12, marginTop: 1 },
  track: { height: 3, borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  fill: { height: 3, borderRadius: 2 },
  remove: { padding: 4 },
});
