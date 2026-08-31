import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PostHeaderActionProps {
  onPress: () => void;
  /** Dims the label to 50% and blocks taps. */
  disabled?: boolean;
  label?: string;
}

/** "Post" text button for the native header's right slot. */
export default function PostHeaderAction({ onPress, disabled = false, label = 'Post' }: PostHeaderActionProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={[styles.label, { color: colors.primary, opacity: disabled ? 0.5 : 1 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: '600',
  },
});
