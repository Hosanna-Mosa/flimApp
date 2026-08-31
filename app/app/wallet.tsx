import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useWallet } from '@/hooks/useWallet';
import WalletBalanceCard from '@/components/wallet/WalletBalanceCard';
import TransactionList from '@/components/wallet/TransactionList';
import AmountEntrySheet from '@/components/wallet/AmountEntrySheet';

export default function WalletScreen() {
  const w = useWallet();
  const insets = useSafeAreaInsets();

  if (w.isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Screen
      title="Wallet"
      refreshing={w.isRefreshing}
      onRefresh={w.onRefresh}
      contentStyle={{ paddingBottom: insets.bottom + 40 }}
    >
      <AmountEntrySheet
        visible={w.deposit.visible}
        onClose={w.deposit.close}
        title="Enter Amount"
        value={w.deposit.amount}
        onChange={w.deposit.setAmount}
        quickAmounts={w.deposit.quickAmounts}
        onSubmit={w.deposit.submit}
      />

      <WalletBalanceCard balance={w.balance} processing={w.isProcessing} onDeposit={w.deposit.open} />

      <TransactionList transactions={w.transactions} />
    </Screen>
  );
}
