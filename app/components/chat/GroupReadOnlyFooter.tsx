import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface GroupReadOnlyFooterProps {
  /** False when the group could not be loaded at all. */
  groupFound: boolean;
}

/** Footer shown in place of the composer when the viewer cannot post. */
export default function GroupReadOnlyFooter({ groupFound }: GroupReadOnlyFooterProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <Text style={{ color: colors.textSecondary }}>
        {groupFound ? 'Only admins can send messages.' : 'Group not found'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
  },
});
