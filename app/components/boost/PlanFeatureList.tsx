import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PlanFeatureListProps {
  features: string[];
}

/** Checkmark bullet list of what a plan includes. */
export default function PlanFeatureList({ features }: PlanFeatureListProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.list}>
      {features.map((feature, idx) => (
        <View key={idx} style={styles.item}>
          <CheckCircle2 size={14} color={colors.primary} />
          <Text style={[styles.text, { color: colors.textSecondary }]}>{feature}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  text: {
    fontSize: 13,
  },
});
