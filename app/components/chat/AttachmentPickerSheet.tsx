import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Crop, ImageIcon, Scissors, Video } from 'lucide-react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import { useTheme } from '@/contexts/ThemeContext';
import { CHAT_LIMITS } from '@/hooks/useChatAttachment';

interface AttachmentPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: 'image' | 'video', edit: boolean) => void;
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
    {
      kind: 'image' as const,
      edit: false,
      label: 'Photo',
      hint: `Full frame, up to ${mb(CHAT_LIMITS.image)} MB`,
      icon: ImageIcon,
    },
    {
      kind: 'image' as const,
      edit: true,
      label: 'Photo, cropped',
      // Said plainly: iOS gives no choice about the shape, and finding that
      // out only after the crop tool opens is worse than being told.
      hint: 'Choose the part you want — square on iPhone',
      icon: Crop,
    },
    {
      kind: 'video' as const,
      edit: false,
      label: 'Video',
      hint: `Whole clip, up to ${mb(CHAT_LIMITS.video)} MB`,
      icon: Video,
    },
    {
      kind: 'video' as const,
      edit: true,
      label: 'Video, trimmed',
      hint: 'Pick the part to send',
      icon: Scissors,
    },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Attach" scroll={false}>
      <View style={styles.rows}>
        {options.map(({ kind, edit, label, hint, icon: Icon }) => (
          <TouchableOpacity
            key={`${kind}-${edit}`}
            style={[styles.row, { borderColor: colors.border }]}
            onPress={() => onPick(kind, edit)}
            activeOpacity={0.6}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.surface }]}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View style={styles.labels}>
              <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
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
