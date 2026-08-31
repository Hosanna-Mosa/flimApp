import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ChipProps {
  label: string;
  /** Visual tone; 'primary' tints with the brand color, others use semantics. */
  tone?: 'neutral' | 'primary' | 'success' | 'danger';
  size?: 'small' | 'medium';
  style?: StyleProp<ViewStyle>;
}

/** Small pill for roles, statuses, and counts. */
export default function Chip({ label, tone = 'neutral', size = 'medium', style }: ChipProps) {
  const { colors } = useTheme();

  const toneColors = {
    neutral: { bg: colors.surface, text: colors.textSecondary },
    primary: { bg: `${colors.primary}20`, text: colors.primary },
    success: { bg: `${colors.success}20`, text: colors.success },
    danger: { bg: `${colors.error}20`, text: colors.error },
  }[tone];

  return (
    <View
      style={[
        styles.chip,
        size === 'small' && styles.chipSmall,
        { backgroundColor: toneColors.bg },
        style,
      ]}
    >
      <Text style={[styles.label, size === 'small' && styles.labelSmall, { color: toneColors.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  labelSmall: {
    fontSize: 11,
  },
});
