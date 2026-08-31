import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface UploadFormHeaderProps {
  title: string;
  onClose: () => void;
  disabled?: boolean;
}

/** "New Image" style title row with a close (X) on the right. */
export default function UploadFormHeader({ title, onClose, disabled }: UploadFormHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <TouchableOpacity onPress={onClose} disabled={disabled}>
        <X size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700' },
});
