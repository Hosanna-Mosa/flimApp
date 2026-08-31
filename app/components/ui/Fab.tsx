import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { LucideIcon, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FabProps {
  onPress: () => void;
  icon?: LucideIcon;
  /** Button diameter (default 64). */
  size?: number;
  /** Icon size (default 32). */
  iconSize?: number;
  /** Distance from the bottom edge (default 24) — raise it above the nav bar. */
  bottom?: number;
  accessibilityLabel?: string;
}

/** Floating action button pinned bottom-right of a screen. */
export default function Fab({
  onPress,
  icon: Icon = Plus,
  size = 64,
  iconSize = 32,
  bottom = 24,
  accessibilityLabel,
}: FabProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.fab,
        { backgroundColor: colors.primary, bottom, width: size, height: size, borderRadius: size / 2 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Icon size={iconSize} color={colors.onPrimary} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 100,
  },
});
