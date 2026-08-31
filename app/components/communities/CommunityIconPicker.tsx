import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CommunityIconPickerProps {
  /** Local or remote image URI; empty shows the "Upload Icon" placeholder. */
  uri: string | null;
  onPick: () => void;
  disabled?: boolean;
}

/** Circular dashed upload target with preview and a "Tap to change" hint. */
export default function CommunityIconPicker({ uri, onPick, disabled }: CommunityIconPickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={[styles.upload, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPick}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Choose community icon"
      >
        {uri ? (
          <Image source={{ uri }} style={styles.preview} contentFit="cover" />
        ) : (
          <>
            <Camera size={32} color={colors.textSecondary} />
            <Text style={[styles.hint, { color: colors.textSecondary }]}>Upload Icon</Text>
          </>
        )}
      </TouchableOpacity>
      {!!uri && (
        <Text style={[styles.hint, styles.changeHint, { color: colors.textSecondary }]}>
          Tap to change
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    alignItems: 'center',
    marginBottom: 24,
  },
  upload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  hint: {
    fontSize: 12,
  },
  changeHint: {
    marginTop: 8,
  },
});
