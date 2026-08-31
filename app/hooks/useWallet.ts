import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { startRazorpayWebCheckout } from '@/utils/payments';

export interface WalletTransaction {
  type: 'credit' | 'debit' | string;
  description?: string;
  amount: number;
  createdAt: string;
}

export const QUICK_DEPOSIT_AMOUNTS = ['100', '500', '1000', '2000'];

/**
 * All Wallet-screen logic: balance + transaction fetching (re-run on focus),
 * pull-to-refresh, and the deposit sheet + Razorpay web checkout. The screen
 * and its components stay presentational.
 */
export function useWallet() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, refreshUser } = useAuth();

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [depositVisible, setDepositVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('500');

  const fetchWalletData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await api.getWalletBalance(token || undefined);
      setBalance(data.balance);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWalletData();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchWalletData(false);
  };

  const openDeposit = () => setDepositVisible(true);
  const closeDeposit = () => setDepositVisible(false);

  // Deposits go through Razorpay's hosted checkout in the system browser on
  // both platforms — see utils/payments.ts. The wallet is credited server-side
  // when the payment is verified, so nothing here is trusted to move money.
  const executeDeposit = async () => {
    const amount = parseFloat(depositAmount);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    setDepositVisible(false);

    try {
      setIsProcessing(true);

      const outcome = await startRazorpayWebCheckout({
        token: token || '',
        purpose: 'WALLET',
        amount,
        themeColor: colors.primary,
      });

      if (outcome.status === 'success') {
        await refreshUser();
        await fetchWalletData(false);
        router.push({
          pathname: '/wallet/success',
          params: { amount: String(amount), type: 'deposit' },
        });
        return;
      }

      if (outcome.status === 'pending') {
        // Captured but not yet confirmed to us. Re-reading the balance is the
        // right move — never re-charge.
        await fetchWalletData(false);
        Alert.alert(
          'Payment Processing',
          'We are still confirming your payment with the bank. Your balance will update automatically once it clears.'
        );
        return;
      }

      if (outcome.status === 'cancelled') {
        // Silent: the user closed the payment page on purpose.
        return;
      }

      Alert.alert('Payment Failed', outcome.reason || 'Transaction could not be completed.');
    } catch (error: any) {
      console.error('[Payments] Wallet deposit failed:', error);
      Alert.alert(
        'Error',
        error?.status === 404
          ? 'User profile not found. Try logging out and back in'
          : error?.message || 'Failed to process transaction'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    balance,
    transactions,
    isLoading,
    isRefreshing,
    isProcessing,
    onRefresh,
    deposit: {
      visible: depositVisible,
      amount: depositAmount,
      setAmount: setDepositAmount,
      quickAmounts: QUICK_DEPOSIT_AMOUNTS,
      open: openDeposit,
      close: closeDeposit,
      submit: executeDeposit,
    },
  };
}
