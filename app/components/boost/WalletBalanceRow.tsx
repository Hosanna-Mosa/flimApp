import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface WalletBalanceRowProps {
  balance: number;
  onPress: () => void;
}

/** Compact "Wallet balance · ₹x" row; tapping opens the wallet. */
export default function WalletBalanceRow({ balance, onPress }: WalletBalanceRowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
    >
      <Text style={[styles.label, { color: colors.textSecondary }]}>Wallet balance</Text>
      <Text style={[styles.value, { color: colors.primary }]}>₹{balance}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
