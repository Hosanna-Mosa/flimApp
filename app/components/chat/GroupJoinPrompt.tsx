import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface GroupJoinPromptProps {
  onJoin: () => void;
  loading?: boolean;
}

// White label on the gold button, matching the group bubble look.
const ON_BUTTON = '#FFFFFF';

/** Footer shown in place of the composer when the viewer is not a member. */
export default function GroupJoinPrompt({ onJoin, loading }: GroupJoinPromptProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.footer,
        { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) },
      ]}
    >
      <Text style={[styles.text, { color: colors.text }]}>You are not a member of this group.</Text>
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onJoin} disabled={loading}>
        {loading ? <ActivityIndicator color={ON_BUTTON} /> : <Text style={styles.buttonText}>Join Group</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  text: {
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: ON_BUTTON,
    fontWeight: '700',
  },
});
