import React from 'react';
import { Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CommunityHeaderActionProps {
  onPress: () => void;
  /** Swaps the icon/label for a spinner and disables the button. */
  loading?: boolean;
  disabled?: boolean;
  /** Icon variant (e.g. Save). Ignored when `label` is given. */
  icon?: LucideIcon;
  /** Text variant (e.g. "Create"). */
  label?: string;
  accessibilityLabel?: string;
}

/** Primary-tinted submit action for the native header's right slot. */
export default function CommunityHeaderAction({
  onPress,
  loading,
  disabled,
  icon: Icon,
  label,
  accessibilityLabel,
}: CommunityHeaderActionProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : label ? (
        <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
      ) : Icon ? (
        <Icon color={colors.primary} size={24} />
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
