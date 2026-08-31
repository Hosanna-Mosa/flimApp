import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityType } from '@/types';

interface CommunityTypeSelectorProps {
  value: CommunityType;
  onChange: (type: CommunityType) => void;
}

const TYPES: CommunityType[] = ['industry', 'role', 'project', 'general'];

/** Labelled row of pill chips for choosing the community type. */
export default function CommunityTypeSelector({ value, onChange }: CommunityTypeSelectorProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.label, { color: colors.text }]}>Community Type</Text>
      <View style={styles.chips}>
        {TYPES.map((t) => {
          const selected = value === t;
          return (
            <TouchableOpacity
              key={t}
              style={[
                styles.chip,
                selected
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
              ]}
              onPress={() => onChange(t)}
            >
              <Text style={[styles.chipText, { color: selected ? colors.onPrimary : colors.text }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
