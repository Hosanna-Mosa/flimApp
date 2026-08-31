import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from '@/components/ui/BottomSheet';
import { CommunityGroup } from '@/types';

interface GroupPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  groups: CommunityGroup[];
  selectedGroupId: string;
  /** Called with the tapped group's id; the caller closes the sheet. */
  onSelect: (groupId: string) => void;
}

/** Bottom sheet listing postable groups, with a ✓ on the selected one. */
export default function GroupPickerSheet({
  visible,
  onClose,
  groups,
  selectedGroupId,
  onSelect,
}: GroupPickerSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Select Group">
      {groups.map((g) => {
        const selected = g._id === selectedGroupId;
        return (
          <TouchableOpacity
            key={g._id}
            style={[styles.groupItem, { borderBottomColor: colors.border }]}
            onPress={() => onSelect(g._id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.groupItemName, { color: colors.text, fontWeight: selected ? 'bold' : 'normal' }]}>
              {g.name}
            </Text>
            {selected && <Text style={{ color: colors.primary }}>✓</Text>}
          </TouchableOpacity>
        );
      })}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  groupItem: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  groupItemName: {
    fontSize: 16,
  },
});
