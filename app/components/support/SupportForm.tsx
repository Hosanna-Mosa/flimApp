import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AttachmentPicker from '@/components/support/AttachmentPicker';

interface SupportFormProps {
  reason: string;
  onChangeReason: (text: string) => void;
  imageUri: string | null;
  onPickImage: () => void;
  onRemoveImage: () => void;
}

/** "Reason for Contact" text area plus the optional screenshot attachment. */
export default function SupportForm({
  reason,
  onChangeReason,
  imageUri,
  onPickImage,
  onRemoveImage,
}: SupportFormProps) {
  const { colors } = useTheme();
  return (
    <>
      <View style={[styles.reasonCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.label, { color: colors.text }]}>Reason for Contact</Text>
        <TextInput
          style={[styles.textInput, { color: colors.text }]}
          placeholder="Describe your issue or feedback..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={6}
          value={reason}
          onChangeText={onChangeReason}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.attachmentSection}>
        <Text style={[styles.label, { color: colors.text }]}>Attachment (Optional)</Text>
        <AttachmentPicker imageUri={imageUri} onPick={onPickImage} onRemove={onRemoveImage} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  reasonCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    fontSize: 16,
    minHeight: 120,
  },
  attachmentSection: {
    marginBottom: 24,
  },
});
