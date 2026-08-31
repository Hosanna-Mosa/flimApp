import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTheme } from '@/contexts/ThemeContext';
import Section from '@/components/layout/Section';
import { PresetAvatar } from '@/constants/avatars';

interface PresetAvatarRowProps {
  title: string;
  avatars: PresetAvatar[];
  selectedId?: string | null;
  onSelect: (preset: PresetAvatar) => void;
  disabled?: boolean;
}

/** Titled horizontal carousel of ready-made SVG avatars. */
export default function PresetAvatarRow({
  title,
  avatars,
  selectedId,
  onSelect,
  disabled,
}: PresetAvatarRowProps) {
  const { colors } = useTheme();

  return (
    <Section title={title}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {avatars.map((preset) => (
          <TouchableOpacity
            key={preset.id}
            onPress={() => onSelect(preset)}
            disabled={disabled}
            style={[
              styles.item,
              selectedId === preset.id && { borderColor: colors.primary, borderWidth: 2 },
            ]}
          >
            <SvgXml xml={preset.svg} width="100%" height="100%" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Section>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingHorizontal: 4,
  },
  item: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
});
