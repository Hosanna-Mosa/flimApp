import React from 'react';
import { View, StyleSheet } from 'react-native';
import { HelpCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import EmptyState from '@/components/ui/EmptyState';
import DocumentListItem from '@/components/verification/DocumentListItem';
import { DocumentItem } from '@/constants/verification';

interface DocumentListProps {
  documents: DocumentItem[];
  onRemove: (index: number) => void;
}

/** The picked-documents list, or a dashed empty state when there are none. */
export default function DocumentList({ documents, onRemove }: DocumentListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.docList}>
      {documents.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="No documents added yet"
          style={[styles.emptyDocs, { borderColor: colors.border }]}
        />
      ) : (
        documents.map((doc, idx) => (
          <DocumentListItem key={idx} document={doc} onRemove={() => onRemove(idx)} />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  docList: { gap: 12 },
  emptyDocs: { borderStyle: 'dashed', borderWidth: 1, borderRadius: 12 },
});
