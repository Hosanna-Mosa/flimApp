import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDateTime } from '@/utils/date';

interface PostCaptionProps {
  caption?: string;
  createdAt: string;
}

/** Caption text with the post timestamp beneath it. */
export default function PostCaption({ caption, createdAt }: PostCaptionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.caption, { color: colors.text }]}>{caption}</Text>
      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>{formatDateTime(createdAt)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
  },
});
