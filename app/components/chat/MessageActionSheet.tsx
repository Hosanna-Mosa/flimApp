import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Copy, CornerUpLeft, Forward, Trash2 } from 'lucide-react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import { useTheme } from '@/contexts/ThemeContext';

export interface MessageActionTarget {
  id: string;
  text: string;
  isMine: boolean;
}

interface MessageActionSheetProps {
  target: MessageActionTarget | null;
  onClose: () => void;
  onDelete?: (messageId: string) => void;
  onReply?: (target: MessageActionTarget) => void;
  onForward?: (target: MessageActionTarget) => void;
  /** Confirmation toast, so the sheet does not own a snackbar. */
  onCopied?: () => void;
}

/**
 * Long-press menu for a single message.
 *
 * Delete already worked before this existed, but only as an undocumented
 * long-press on your own message — no menu, no hint, nothing to discover. It
 * read as missing because nothing said it was there.
 *
 * Delete is shown only on your own messages: the API rejects deleting someone
 * else's, and offering an action that always fails is worse than omitting it.
 */
export default function MessageActionSheet({
  target,
  onClose,
  onDelete,
  onReply,
  onForward,
  onCopied,
}: MessageActionSheetProps) {
  const { colors } = useTheme();

  if (!target) return null;

  const act = (fn?: () => void) => {
    onClose();
    // Let the sheet finish dismissing before anything else opens, or the next
    // modal races the closing animation and neither appears on iOS.
    if (fn) setTimeout(fn, 220);
  };

  const rows = [
    {
      key: 'copy',
      label: 'Copy',
      icon: Copy,
      show: !!target.text,
      onPress: () =>
        act(async () => {
          await Clipboard.setStringAsync(target.text);
          onCopied?.();
        }),
    },
    {
      key: 'reply',
      label: 'Reply',
      icon: CornerUpLeft,
      show: !!onReply,
      onPress: () => act(() => onReply?.(target)),
    },
    {
      key: 'forward',
      label: 'Forward',
      icon: Forward,
      show: !!onForward,
      onPress: () => act(() => onForward?.(target)),
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: Trash2,
      show: target.isMine && !!onDelete,
      destructive: true,
      onPress: () => act(() => onDelete?.(target.id)),
    },
  ].filter((r) => r.show);

  return (
    <BottomSheet visible onClose={onClose} scroll={false}>
      {/* The message itself, so it is obvious which one is being acted on. */}
      <View style={[styles.preview, { backgroundColor: colors.surface }]}>
        <Text numberOfLines={2} style={[styles.previewText, { color: colors.textSecondary }]}>
          {target.text || 'Attachment'}
        </Text>
      </View>

      <View style={styles.rows}>
        {rows.map((row) => {
          const Icon = row.icon;
          const tint = row.destructive ? colors.error : colors.text;
          return (
            <TouchableOpacity
              key={row.key}
              style={styles.row}
              onPress={row.onPress}
              activeOpacity={0.6}
            >
              <Icon size={20} color={tint} />
              <Text style={[styles.rowLabel, { color: tint }]}>{row.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  preview: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 19,
  },
  rows: {
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
