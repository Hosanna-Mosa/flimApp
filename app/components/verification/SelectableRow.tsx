import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SelectableRowProps {
  icon: LucideIcon;
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

/**
 * Radio-style option row used by the verification sheets: tinted icon circle,
 * label (+ optional description), and a radio dot on the right. Kept here
 * rather than reusing SelectableCard, which is an emoji-icon, filled-when-
 * selected card with a different look.
 */
export default function SelectableRow({ icon: Icon, label, description, selected, onPress }: SelectableRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: selected ? colors.primary : colors.border },
        selected && styles.cardSelected,
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: selected ? `${colors.primary}20` : colors.background }]}>
        <Icon size={20} color={selected ? colors.primary : colors.textSecondary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.label, { color: selected ? colors.primary : colors.text }]}>{label}</Text>
        {!!description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
        )}
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardSelected: { borderWidth: 2 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 16, fontWeight: '600' },
  description: { fontSize: 12, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5 },
});
