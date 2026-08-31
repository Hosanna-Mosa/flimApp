import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UnreadBadgeProps {
  count: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Red count pill pinned to the top-right corner of its parent (e.g. a
 * header icon). Caps at "99+" and renders nothing for zero.
 */
export default function UnreadBadge({ count, style }: UnreadBadgeProps) {
  const { colors } = useTheme();

  if (count <= 0) return null;
  return (
    <View
      style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.background }, style]}
      pointerEvents="none"
    >
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    elevation: 5,
    zIndex: 999,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
