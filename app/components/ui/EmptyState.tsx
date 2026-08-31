import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  /**
   * 'fullscreen' centers within a flex:1 container (use when it is the whole
   * body); 'inline' pads a block inside an existing scroll view.
   */
  variant?: 'inline' | 'fullscreen';
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function EmptyState({
  icon: Icon,
  title,
  subtitle,
  variant = 'inline',
  action,
  style,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View style={[variant === 'fullscreen' ? styles.fullscreen : styles.inline, style]}>
      {Icon && <Icon size={44} color={colors.textSecondary} strokeWidth={1.5} />}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {!!subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      )}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  inline: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
});
