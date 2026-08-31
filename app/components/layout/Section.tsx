import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SectionProps {
  title?: string;
  /** Optional right-aligned action (e.g. a "View all" link). */
  action?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/** Titled block of a page. Owns section spacing so screens don't. */
export default function Section({ title, action, style, children }: SectionProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, style]}>
      {(title || action) && (
        <View style={styles.header}>
          {!!title && <Text style={[styles.title, { color: colors.textSecondary }]}>{title}</Text>}
          {action}
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
