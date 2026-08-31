import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCheck, Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityPrivary } from '@/types';

interface PrivacyRadioRowsProps {
  value: CommunityPrivary;
  onChange: (privacy: CommunityPrivary) => void;
}

/** Public / Private single-choice rows in a card (community settings). */
export default function PrivacyRadioRows({ value, onChange }: PrivacyRadioRowsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={[styles.row, styles.divided, { borderBottomColor: colors.border }]}
        onPress={() => onChange('public')}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'public' }}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Public</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Anyone can join and view posts
          </Text>
        </View>
        {value === 'public' && <UserCheck color={colors.primary} size={20} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        onPress={() => onChange('private')}
        accessibilityRole="radio"
        accessibilityState={{ selected: value === 'private' }}
      >
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>Private</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Admin approval required to join
          </Text>
        </View>
        {value === 'private' && <Lock color={colors.primary} size={20} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  divided: {
    borderBottomWidth: 1,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
});
