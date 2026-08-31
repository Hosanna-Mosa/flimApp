import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface SubmitFooterProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Full-width primary button pinned under the form (Screen `footer` slot). */
export default function SubmitFooter({ title, onPress, disabled, loading }: SubmitFooterProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <Button title={title} onPress={onPress} disabled={disabled} loading={loading} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { padding: 20, borderTopWidth: 1 },
  button: { width: '100%' },
});
