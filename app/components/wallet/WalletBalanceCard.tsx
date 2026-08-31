import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Wallet as WalletIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface WalletBalanceCardProps {
  balance: number;
  /** Shows the Deposit button in its loading state while checkout is open. */
  processing?: boolean;
  onDeposit: () => void;
}

/** Gradient hero card: total balance plus the Deposit Funds action. */
export default function WalletBalanceCard({ balance, processing = false, onDeposit }: WalletBalanceCardProps) {
  const { colors } = useTheme();

  return (
    <LinearGradient
      // Theme-aware: a subtle card-to-surface wash instead of the fixed dark gradient.
      colors={[colors.card, colors.surface]}
      style={[styles.card, { borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: `${colors.primary}20` }]}>
          <WalletIcon size={24} color={colors.primary} />
        </View>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Total Balance</Text>
      </View>

      <Text style={[styles.amount, { color: colors.text }]}>₹{balance.toLocaleString('en-IN')}</Text>

      <View style={styles.actionRow}>
        <Button title="Deposit Funds" onPress={onDeposit} style={styles.fullButton} loading={processing} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    marginBottom: 32,
    elevation: 4,
    // Drop shadows are black in both themes; not a theme token.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  amount: {
    fontSize: 42,
    fontWeight: '900',
    marginBottom: 24,
    letterSpacing: -1,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullButton: {
    flex: 1,
    height: 56,
  },
});
