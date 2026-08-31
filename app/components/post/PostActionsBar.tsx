import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, Share2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PostActionsBarProps {
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  onShare: () => void;
}

/** Like (with count) and share actions, bordered above and below. */
export default function PostActionsBar({ isLiked, likesCount, onLike, onShare }: PostActionsBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.actions, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
      <TouchableOpacity style={styles.action} onPress={onLike}>
        <Heart
          size={22}
          color={isLiked ? colors.error : colors.textSecondary}
          fill={isLiked ? colors.error : 'transparent'}
        />
        <Text style={[styles.actionText, { color: colors.textSecondary }]}>{likesCount}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.action} onPress={onShare}>
        <Share2 size={22} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
