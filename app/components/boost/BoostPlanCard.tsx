import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { BoostPlan } from '@/constants/plans';
import PlanFeatureList from '@/components/boost/PlanFeatureList';

interface BoostPlanCardProps {
  plan: BoostPlan;
  selected: boolean;
  onPress: () => void;
}

/** Selectable plan tile: optional BEST VALUE badge, title/duration, price, blurb, features. */
export default function BoostPlanCard({ plan, selected, onPress }: BoostPlanCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        selected && { borderColor: colors.primary, borderWidth: 2 },
      ]}
      onPress={onPress}
    >
      {plan.popular && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.onPrimary }]}>BEST VALUE</Text>
        </View>
      )}

      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>{plan.label}</Text>
          <Text style={[styles.duration, { color: colors.textSecondary }]}>{plan.duration}</Text>
        </View>
        <Text style={[styles.price, { color: colors.text }]}>₹{plan.price}</Text>
      </View>

      <Text style={[styles.description, { color: colors.textSecondary }]}>{plan.description}</Text>

      <PlanFeatureList features={plan.features} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  duration: {
    fontSize: 13,
    marginTop: 2,
  },
  price: {
    fontSize: 24,
    fontWeight: '900',
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
});
