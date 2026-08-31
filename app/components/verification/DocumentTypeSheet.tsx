import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/Button';
import Input from '@/components/Input';
import SelectableRow from '@/components/verification/SelectableRow';
import { DOCUMENT_TYPES } from '@/constants/verification';

interface DocumentTypeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Currently selected DOCUMENT_TYPES value. */
  selectedType: string;
  onSelectType: (value: string) => void;
  /** Optional display name for the document about to be picked. */
  name: string;
  onChangeName: (value: string) => void;
  /** Opens the system document picker. */
  onContinue: () => void;
}

/** Bottom sheet: pick a document type, optionally name it, then continue to the file picker. */
export default function DocumentTypeSheet({
  visible,
  onClose,
  selectedType,
  onSelectType,
  name,
  onChangeName,
  onContinue,
}: DocumentTypeSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Document"
      footer={
        <View style={styles.actionRow}>
          <Button title="Cancel" onPress={onClose} variant="outline" style={styles.cancel} />
          <Button title="Continue to Upload" onPress={onContinue} style={styles.continue} />
        </View>
      }
    >
      <View style={styles.sheetHeader}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose the type of document you want to upload
        </Text>
      </View>

      <View style={styles.list}>
        {DOCUMENT_TYPES.map((type) => (
          <SelectableRow
            key={type.value}
            icon={type.icon}
            label={type.label}
            description={type.desc}
            selected={selectedType === type.value}
            onPress={() => onSelectType(type.value)}
          />
        ))}
      </View>

      <View style={styles.nameInputContainer}>
        <Input
          label="Document Name (Optional)"
          value={name}
          onChangeText={onChangeName}
          placeholder="e.g. My Portfolio.pdf"
          style={{ backgroundColor: colors.background }}
        />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetHeader: { marginBottom: 24 },
  subtitle: { fontSize: 14 },
  list: { gap: 12, marginBottom: 24 },
  nameInputContainer: { marginBottom: 24 },
  actionRow: { flexDirection: 'row', gap: 12 },
  cancel: { flex: 1 },
  continue: { flex: 1.5 },
});
