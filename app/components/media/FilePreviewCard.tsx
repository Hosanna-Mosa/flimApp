import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Music, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FilePreviewCardProps {
  type: 'audio' | 'script';
  name: string;
  /** Bytes; rendered as "1.23 MB". */
  size?: number;
}

/** Icon + filename + size for non-visual media (audio files, scripts). */
export default function FilePreviewCard({ type, name, size }: FilePreviewCardProps) {
  const { colors } = useTheme();
  const Icon = type === 'audio' ? Music : FileText;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <Icon size={40} color={colors.primary} />
      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.size, { color: colors.textSecondary }]}>
        {size ? (size / 1024 / 1024).toFixed(2) : '0'} MB
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  name: { fontSize: 16, fontWeight: '600', paddingHorizontal: 20 },
  size: { fontSize: 14 },
});
