import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface SelectableCardProps {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  selected: boolean;
  onToggle: (id: string) => void;
  color?: string;
}

export default function SelectableCard({
  id,
  label,
  icon,
  description,
  selected,
  onToggle,
  color,
}: SelectableCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle(id);
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: selected ? color || colors.primary : colors.border,
          borderWidth: 2,
        },
        selected && {
          backgroundColor: color ? `${color}15` : `${colors.primary}15`,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
});
