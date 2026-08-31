import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { ChevronRight, LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SettingsRowProps {
  icon?: LucideIcon;
  /** Icon color; defaults to secondary text, or the error color when destructive. */
  iconColor?: string;
  /** Draw the icon inside a tinted circle (menu-style rows). */
  iconTinted?: boolean;
  label: string;
  description?: string;
  onPress?: () => void;
  /** 'chevron' (default when onPress is set), 'none', or a custom element (e.g. <Toggle />). */
  trailing?: 'chevron' | 'none' | React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * One row of a settings / menu list: icon · label · description · trailing.
 * Every settings-style list in the app renders through this.
 */
export default function SettingsRow({
  icon: Icon,
  iconColor,
  iconTinted,
  label,
  description,
  onPress,
  trailing,
  destructive,
  disabled,
  style,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const accent = destructive ? colors.error : colors.text;
  const resolvedIconColor = iconColor ?? (destructive ? colors.error : iconTinted ? colors.primary : colors.textSecondary);
  const showChevron = trailing === 'chevron' || (trailing === undefined && !!onPress);

  const content = (
    <>
      <View style={styles.info}>
        {Icon &&
          (iconTinted ? (
            <View style={[styles.iconTint, { backgroundColor: `${colors.primary}15` }]}>
              <Icon size={24} color={resolvedIconColor} />
            </View>
          ) : (
            <Icon size={24} color={resolvedIconColor} />
          ))}
        <View style={styles.text}>
          <Text style={[styles.label, { color: accent }]}>{label}</Text>
          {!!description && (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
          )}
        </View>
      </View>
      {showChevron ? (
        <ChevronRight size={20} color={colors.textSecondary} />
      ) : trailing === 'none' || trailing === undefined ? null : (
        trailing
      )}
    </>
  );

  const rowStyle = [
    styles.row,
    { backgroundColor: colors.card, borderColor: destructive ? colors.error : colors.border },
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={rowStyle} onPress={onPress} disabled={disabled} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }
  return <View style={rowStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  info: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  iconTint: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
    marginTop: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});
