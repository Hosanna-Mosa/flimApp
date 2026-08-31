import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { History } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Section from '@/components/layout/Section';
import EmptyState from '@/components/ui/EmptyState';
import TransactionItem from '@/components/wallet/TransactionItem';
import type { WalletTransaction } from '@/hooks/useWallet';

interface TransactionListProps {
  transactions: WalletTransaction[];
  /** How many of the most recent transactions to show (default 10). */
  limit?: number;
  onViewAll?: () => void;
}

/** "Recent Transactions" section with a View All action and an empty state. */
export default function TransactionList({ transactions, limit = 10, onViewAll }: TransactionListProps) {
  const { colors } = useTheme();

  return (
    <Section
      title="Recent Transactions"
      action={
        <TouchableOpacity onPress={onViewAll}>
          <Text style={[styles.viewAll, { color: colors.primary }]}>View All</Text>
        </TouchableOpacity>
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No transactions yet"
          style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}
        />
      ) : (
        <View>
          {transactions.slice(0, limit).map((tx, idx) => (
            <TransactionItem key={idx} transaction={tx} />
          ))}
        </View>
      )}
    </Section>
  );
}

const styles = StyleSheet.create({
  viewAll: {
    fontSize: 13,
  },
  empty: {
    padding: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderStyle: 'dashed',
  },
});
