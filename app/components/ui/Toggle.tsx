import React from 'react';
import { TouchableOpacity, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ToggleProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Shows a spinner in place of the thumb while a change is being saved. */
  loading?: boolean;
}

/** The app's switch: primary pill when on, surface pill when off. */
export default function Toggle({ value, onValueChange, disabled, loading }: ToggleProps) {
  const { colors } = useTheme();
  const isOff = !value;

  return (
    <TouchableOpacity
      style={[
        styles.track,
        { backgroundColor: value ? colors.primary : colors.surface, borderColor: colors.border },
        (disabled || loading) && styles.dimmed,
      ]}
      onPress={() => onValueChange(!value)}
      disabled={disabled || loading}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={value ? colors.onPrimary : colors.primary} />
      ) : (
        <View
          style={[
            styles.thumb,
            { backgroundColor: value ? colors.onPrimary : colors.textSecondary },
            !isOff && styles.thumbOn,
          ]}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
  dimmed: {
    opacity: 0.6,
  },
});
