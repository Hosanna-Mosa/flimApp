import React from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import UnreadBadge from '@/components/ui/UnreadBadge';

interface HeaderIconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  /** Shows an UnreadBadge over the icon when > 0. */
  badgeCount?: number;
  size?: number;
  /** Defaults to the theme text colour. */
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Icon-only tap target for native header left/right slots. */
export default function HeaderIconButton({
  icon: Icon,
  onPress,
  badgeCount = 0,
  size = 24,
  color,
  style,
  accessibilityLabel,
}: HeaderIconButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[styles.button, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View style={{ width: size, height: size }}>
        <Icon size={size} color={color ?? colors.text} />
        <UnreadBadge count={badgeCount} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    marginHorizontal: 4,
  },
});
