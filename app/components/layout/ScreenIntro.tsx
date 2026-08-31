import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenIntroProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  /**
   * 'centered' stacks icon / title / subtitle (form intros such as Portfolio);
   * 'row' puts the icon beside the title (list headers such as Trending).
   */
  layout?: 'centered' | 'row';
  style?: StyleProp<ViewStyle>;
}

/**
 * Icon + title (+ subtitle) block that opens a page. Owns its own spacing so
 * screens don't have to.
 */
export default function ScreenIntro({ icon: Icon, title, subtitle, layout = 'centered', style }: ScreenIntroProps) {
  const { colors } = useTheme();

  if (layout === 'row') {
    return (
      <View style={[styles.row, style]}>
        <Icon size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.centered, style]}>
      <Icon size={40} color={colors.primary} style={styles.centeredIcon} />
      <Text style={[styles.title, styles.centeredTitle, { color: colors.text }]}>{title}</Text>
      {!!subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  centered: {
    alignItems: 'center',
    marginBottom: 24,
  },
  centeredIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  centeredTitle: {
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 10,
  },
});
