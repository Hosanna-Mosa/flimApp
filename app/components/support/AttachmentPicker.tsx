import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Upload, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface AttachmentPickerProps {
  /** Local URI of the picked screenshot; null shows the upload target. */
  imageUri: string | null;
  onPick: () => void;
  onRemove: () => void;
}

/** Dashed "Upload Screenshot" target, or the picked image with a remove (X) button. */
export default function AttachmentPicker({ imageUri, onPick, onRemove }: AttachmentPickerProps) {
  const { colors } = useTheme();

  if (imageUri) {
    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: imageUri }} style={styles.preview} />
        <TouchableOpacity style={[styles.removeButton, { backgroundColor: colors.error }]} onPress={onRemove}>
          <X size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.uploadButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
      onPress={onPick}
    >
      <Upload size={32} color={colors.primary} />
      <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Upload Screenshot</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    height: 160,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});
