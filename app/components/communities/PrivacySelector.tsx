import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityPrivary } from '@/types';
import Toggle from '@/components/ui/Toggle';

interface PrivacySelectorProps {
  value: CommunityPrivary;
  onChange: (privacy: CommunityPrivary) => void;
}

/**
 * "Private Community" and "Invite Only" toggle rows for the create form.
 * Turning either off returns the community to public.
 */
export default function PrivacySelector({ value, onChange }: PrivacySelectorProps) {
  const { colors } = useTheme();

  const options: { key: CommunityPrivary; title: string; description: string }[] = [
    {
      key: 'private',
      title: 'Private Community',
      description: 'Only members can view posts and groups.',
    },
    {
      key: 'invite-only',
      title: 'Invite Only',
      description: 'Members require approval to join.',
    },
  ];

  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text }]}>Privacy</Text>
      {options.map((opt, index) => (
        <View
          key={opt.key}
          style={[styles.option, { borderColor: colors.border }, index > 0 && styles.optionSpaced]}
        >
          <View style={styles.text}>
            <Text style={[styles.title, { color: colors.text }]}>{opt.title}</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {opt.description}
            </Text>
          </View>
          <Toggle
            value={value === opt.key}
            onValueChange={(on) => onChange(on ? opt.key : 'public')}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  optionSpaced: {
    marginTop: 12,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});
