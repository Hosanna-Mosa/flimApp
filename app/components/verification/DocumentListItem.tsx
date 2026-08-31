import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DOCUMENT_TYPES, DocumentItem } from '@/constants/verification';

interface DocumentListItemProps {
  document: DocumentItem;
  onRemove: () => void;
}

/** One picked document: file icon, name, type label, remove (X). */
export default function DocumentListItem({ document, onRemove }: DocumentListItemProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.docItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <FileText size={20} color={colors.primary} />
      <View style={styles.docInfo}>
        <Text style={[styles.docName, { color: colors.text }]} numberOfLines={1}>{document.name}</Text>
        <Text style={[styles.docType, { color: colors.textSecondary }]}>
          {DOCUMENT_TYPES.find(d => d.value === document.type)?.label}
        </Text>
      </View>
      <TouchableOpacity onPress={onRemove}>
        <X size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  docItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontWeight: '600', fontSize: 14 },
  docType: { fontSize: 12, marginTop: 2 },
});
