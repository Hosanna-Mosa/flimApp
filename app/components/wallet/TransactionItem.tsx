import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate } from '@/utils/date';
import type { WalletTransaction } from '@/hooks/useWallet';

interface TransactionItemProps {
  transaction: WalletTransaction;
}

/** One wallet ledger row: direction icon · description + date · signed amount. */
export default function TransactionItem({ transaction: tx }: TransactionItemProps) {
  const { colors } = useTheme();
  const isCredit = tx.type === 'credit';
  const tone = isCredit ? colors.success : colors.error;

  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconContainer, { backgroundColor: `${tone}20` }]}>
        {isCredit ? <ArrowDownLeft size={20} color={tone} /> : <ArrowUpRight size={20} color={tone} />}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.text }]}>{tx.description || 'Transaction'}</Text>
        <Text style={[styles.date, { color: colors.textSecondary }]}>{formatDate(tx.createdAt)}</Text>
      </View>
      <Text style={[styles.amount, { color: tone }]}>
        {isCredit ? '+' : '-'}₹{tx.amount}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
