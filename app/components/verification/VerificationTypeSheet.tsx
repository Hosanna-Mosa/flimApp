import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/Button';
import SelectableRow from '@/components/verification/SelectableRow';
import { VERIFICATION_TYPES } from '@/constants/verification';

interface VerificationTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Currently selected VERIFICATION_TYPES value. */
  selected: string;
  /** Called with the chosen value; the sheet closes itself afterwards. */
  onSelect: (value: string) => void;
}

/** Bottom sheet listing the professional categories as radio rows. */
export default function VerificationTypeSheet({ visible, onClose, selected, onSelect }: VerificationTypeSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Apply for Category"
      footer={<Button title="Cancel" onPress={onClose} variant="outline" />}
    >
      <View style={styles.sheetHeader}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose the professional category that best describes you
        </Text>
      </View>

      <View style={styles.list}>
        {VERIFICATION_TYPES.map((type) => (
          <SelectableRow
            key={type.value}
            icon={BadgeCheck}
            label={type.label}
            selected={selected === type.value}
            onPress={() => {
              onSelect(type.value);
              onClose();
            }}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: { marginBottom: 24 },
  subtitle: { fontSize: 14 },
  list: { gap: 12, marginBottom: 24 },
});
