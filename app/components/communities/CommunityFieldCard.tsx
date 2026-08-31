import React from 'react';
import { View, Text, TextInput, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface CommunityField {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  autoFocus?: boolean;
}

interface CommunityFieldCardProps {
  fields: CommunityField[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Grouped card of labelled text fields separated by dividers — the
 * name / description editor used by community settings and create group.
 */
export default function CommunityFieldCard({ fields, style }: CommunityFieldCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]}>
      {fields.map((field, index) => {
        const isLast = index === fields.length - 1;
        return (
          <View
            key={field.label}
            style={[styles.group, !isLast && [styles.divided, { borderBottomColor: colors.border }]]}
          >
            <Text style={[styles.label, { color: colors.textSecondary }]}>{field.label}</Text>
            <TextInput
              style={[styles.input, { color: colors.text }, field.multiline && styles.multiline]}
              value={field.value}
              onChangeText={field.onChangeText}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textSecondary}
              multiline={field.multiline}
              autoFocus={field.autoFocus}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  group: {
    padding: 16,
  },
  divided: {
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
  },
  multiline: {
    height: 80,
  },
});
