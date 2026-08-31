import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ContentType } from '@/types';
import { UploadOption } from '@/constants/uploadOptions';

interface ContentTypePickerProps {
  options: UploadOption[];
  value: ContentType | null;
  onSelect: (type: ContentType) => void;
  /** Heading above the picker ("What are you creating?", "Choose Format"). */
  title?: string;
  /**
   * 'grid' = big two-column tiles with tinted icon circles (Create Post);
   * 'row' = compact pill row where the active one is filled (Crowd Fund).
   */
  variant?: 'grid' | 'row';
  disabled?: boolean;
}

/** Content-type selector driven by constants/uploadOptions. */
export default function ContentTypePicker({
  options,
  value,
  onSelect,
  title,
  variant = 'grid',
  disabled,
}: ContentTypePickerProps) {
  const { colors } = useTheme();

  if (variant === 'row') {
    return (
      <View>
        {!!title && <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>}
        <View style={styles.row}>
          {options.map((option) => {
            const Icon = option.icon;
            const active = value === option.type;
            const tint = active ? colors.onPrimary : colors.text;
            return (
              <TouchableOpacity
                key={option.type}
                style={[
                  styles.pill,
                  active && { backgroundColor: colors.primary },
                  { borderColor: colors.border },
                ]}
                onPress={() => onSelect(option.type)}
                disabled={disabled}
              >
                <Icon size={20} color={tint} />
                <Text style={[styles.pillText, { color: tint }]}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridContainer}>
      {!!title && <Text style={[styles.gridTitle, { color: colors.text }]}>{title}</Text>}
      <View style={styles.grid}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <TouchableOpacity
              key={option.type}
              style={[styles.tile, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => onSelect(option.type)}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <View style={[styles.iconCircle, { backgroundColor: `${option.color}15` }]}>
                <Icon size={32} color={option.color} />
              </View>
              <Text style={[styles.tileLabel, { color: colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: { marginTop: 20 },
  gridTitle: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  tile: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: { fontSize: 16, fontWeight: '600' },

  rowTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  pillText: { fontWeight: '600', fontSize: 14 },
});
