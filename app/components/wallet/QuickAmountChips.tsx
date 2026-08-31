import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface QuickAmountChipsProps {
  /** Rupee amounts as strings so they compare directly with the input value. */
  amounts: string[];
  selected: string;
  onSelect: (amount: string) => void;
}

/** Row of preset rupee amounts; the one matching the input is highlighted. */
export default function QuickAmountChips({ amounts, selected, onSelect }: QuickAmountChipsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      {amounts.map((val) => {
        const active = selected === val;
        return (
          <TouchableOpacity
            key={val}
            style={[
              styles.chip,
              { backgroundColor: active ? colors.primary : colors.surface, borderColor: colors.border },
            ]}
            onPress={() => onSelect(val)}
          >
            <Text style={[styles.label, { color: active ? colors.onPrimary : colors.text }]}>₹{val}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
