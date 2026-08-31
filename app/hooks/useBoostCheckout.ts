import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useConfirm } from '@/hooks/useConfirm';
import { startRazorpayWebCheckout } from '@/utils/payments';
import { BOOST_PLANS, BoostPlan } from '@/constants/plans';

/**
 * All Boost-screen logic: plan selection and the wallet-funded boost flow,
 * including the Razorpay top-up for a shortfall and the server's 402 check.
 */
export function useBoostCheckout() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();
  const confirm = useConfirm();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const balance = user?.walletBalance || 0;

  const announceBoosted = (plan: BoostPlan) => {
    Alert.alert(
      'Profile Boosted! 🚀',
      `Your profile is now boosted for ${plan.duration}. Your posts will appear first in everyone's feed!`,
      [{ text: 'Awesome', onPress: () => router.push('/(tabs)/profile') }]
    );
  };

  /**
   * Tops the wallet up through Razorpay web checkout, then boosts.
   *
   * Boosts are always paid for out of the wallet — the backend debits
   * walletBalance atomically, which is what makes double-spending impossible.
   * So "pay with Razorpay" means: buy the shortfall as wallet credit first,
   * then spend it. Razorpay never charges for a boost directly.
   */
  const topUpAndBoost = async (plan: BoostPlan, shortfall: number) => {
    const outcome = await startRazorpayWebCheckout({
      token: token || '',
      purpose: 'WALLET',
      amount: shortfall,
      themeColor: colors.primary,
    });

    if (outcome.status === 'cancelled') return;

    if (outcome.status === 'pending') {
      Alert.alert(
        'Payment Processing',
        'We are still confirming your payment. Once it clears, your balance updates and you can boost from here.'
      );
      await refreshUser();
      return;
    }

    if (outcome.status !== 'success') {
      Alert.alert('Payment Failed', outcome.reason || 'Transaction could not be completed.');
      return;
    }

    await refreshUser();

    try {
      await api.boostProfile(plan.id, token || undefined);
    } catch (err: any) {
      // The top-up already landed, so the money is safe in the wallet — say so
      // rather than leaving the user thinking the payment vanished.
      await refreshUser();
      Alert.alert(
        'Boost Not Applied',
        `Your ₹${shortfall} payment was added to your wallet, but the boost could not be applied: ${
          err?.message || 'unknown error'
        }. Your balance is intact — try selecting the plan again.`
      );
      return;
    }

    await refreshUser();
    announceBoosted(plan);
  };

  const handleBoost = async () => {
    if (!selectedPlan) return;

    const plan = BOOST_PLANS.find((p) => p.id === selectedPlan);
    if (!plan) return;

    try {
      setIsProcessing(true);

      // Boosts are funded from the wallet. Short of funds, offer to buy the
      // difference through Razorpay and continue in the same flow.
      if (balance < plan.price) {
        const shortfall = Math.ceil(plan.price - balance);
        setIsProcessing(false);
        if (
          await confirm({
            title: 'Add Funds',
            message: `${plan.label} costs ₹${plan.price} and your wallet has ₹${balance}. Add ₹${shortfall} with Razorpay to continue?`,
            confirmLabel: `Pay ₹${shortfall}`,
          })
        ) {
          try {
            setIsProcessing(true);
            await topUpAndBoost(plan, shortfall);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to boost profile');
          } finally {
            setIsProcessing(false);
          }
        }
        return;
      }

      await api.boostProfile(plan.id, token || undefined);
      await refreshUser();
      announceBoosted(plan);
    } catch (error: any) {
      // The server does the authoritative balance check; a 402 here means the
      // wallet moved between our check and the debit.
      if (error?.status === 402) {
        Alert.alert('Insufficient Balance', 'Please add funds to your wallet and try again.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Wallet', onPress: () => router.push('/wallet') },
        ]);
      } else {
        Alert.alert('Error', error?.message || 'Failed to boost profile');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    plans: BOOST_PLANS,
    balance,
    selectedPlan,
    setSelectedPlan,
    isProcessing,
    handleBoost,
  };
}
