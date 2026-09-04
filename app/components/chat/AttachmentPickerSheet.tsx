import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ImageIcon, Video } from 'lucide-react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { CHAT_LIMITS } from '@/hooks/useChatAttachment';

interface AttachmentPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: 'image' | 'video') => void;
}

const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

/** Photo or video. The limits are shown up front rather than only on rejection. */
export default function AttachmentPickerSheet({
  visible,
  onClose,
  onPick,
}: AttachmentPickerSheetProps) {
  const { colors } = useTheme();

  const options = [
    { kind: 'image' as const, label: 'Photo', icon: ImageIcon, limit: CHAT_LIMITS.image },
    { kind: 'video' as const, label: 'Video', icon: Video, limit: CHAT_LIMITS.video },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Attach" scroll={false}>
      <View style={styles.rows}>
        {options.map(({ kind, label, icon: Icon, limit }) => (
          <TouchableOpacity
            key={kind}
            style={[styles.row, { borderColor: colors.border }]}
            onPress={() => onPick(kind)}
            activeOpacity={0.6}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={styles.labels}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                Up to {mb(limit)} MB
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  rows: { gap: 10, paddingBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  hint: { fontSize: 13, marginTop: 1 },
});
