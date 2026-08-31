import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GroupIntroCardProps {
  name?: string;
  description?: string;
  isAnnouncementOnly?: boolean;
}

/** "Welcome to <group>" block shown at the top of a group conversation. */
export default function GroupIntroCard({ name, description, isAnnouncementOnly }: GroupIntroCardProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Welcome to {name}</Text>
      <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      <Text style={[styles.note, { color: colors.textSecondary }]}>
        {isAnnouncementOnly ? 'This is an announcement channel.' : 'Start the conversation!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
    opacity: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});
