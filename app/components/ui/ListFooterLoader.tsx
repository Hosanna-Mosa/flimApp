import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** "Loading more" footer for paginated lists. Renders nothing when hidden. */
export default function ListFooterLoader({ visible }: { visible: boolean }) {
  const { colors } = useTheme();

  if (!visible) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
