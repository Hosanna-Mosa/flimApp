import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** Primary-tinted unread count pill for a conversation row. Caps at "9+"; renders nothing for zero. */
export default function UnreadCountPill({ count }: { count: number }) {
  const { colors } = useTheme();
  if (count <= 0) return null;
  return (
    <View style={[styles.pill, { backgroundColor: colors.primary }]}>
      <Text style={[styles.text, { color: colors.onPrimary }]}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
