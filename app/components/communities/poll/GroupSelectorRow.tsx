import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface GroupSelectorRowProps {
  /** Name of the selected group (or the "Select Group" placeholder). */
  groupName: string;
  onPress: () => void;
}

/** "To: <group ▾>" row that opens the group picker. */
export default function GroupSelectorRow({ groupName, onPress }: GroupSelectorRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.groupSelector, { borderBottomColor: colors.border }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`To: ${groupName}`}
    >
      <Text style={[styles.toText, { color: colors.textSecondary }]}>To:</Text>
      <View style={[styles.groupChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.groupName, { color: colors.text }]}>{groupName}</Text>
        <ChevronDown size={14} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  groupSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toText: {
    marginRight: 8,
    fontSize: 16,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  groupName: {
    fontWeight: '500',
  },
});
