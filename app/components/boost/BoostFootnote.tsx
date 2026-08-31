import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** Social-proof line under the CTA. */
export default function BoostFootnote() {
  const { colors } = useTheme();

  return (
    <View style={styles.box}>
      <TrendingUp size={20} color={colors.textSecondary} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        Users see boosted content 5.4x more often on average.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    paddingBottom: 40,
  },
  text: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
