import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UploadProgressBarProps {
  /** 0–100 */
  progress: number;
}

/** Thin primary-coloured track shown under the Post button while uploading. */
export default function UploadProgressBar({ progress }: UploadProgressBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 4, borderRadius: 2, width: '100%', marginTop: -10, overflow: 'hidden' },
  fill: { height: '100%' },
});
