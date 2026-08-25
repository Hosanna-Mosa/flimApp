import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Zap,
  CheckCircle2,
  TrendingUp,
  Target,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import Button from '@/components/Button';
import { startRazorpayWebCheckout } from '@/utils/payments';
import { LinearGradient } from 'expo-linear-gradient';

const BOOST_PLANS = [
  {
    id: 'BASIC_BOOST',
    label: 'Standard Boost',
    price: 299,
    duration: '24 Hours',
    description: 'Get 2x more visibility in the feed',
    features: ['Priority feed placement', 'Enhanced profile visibility'],
  },
  {
    id: 'PRO_BOOST',
    label: 'Pro Boost',
    price: 799,
    duration: '3 Days',
    description: 'Maximum exposure for your profile',
    popular: true,
    features: ['Top priority in feed forever*', 'Featured profile badge', 'Reach 5x more people'],
  },
  {
    id: 'ULTRA_BOOST',
    label: 'Ultra Boost',
    price: 1499,
    duration: '7 Days',
    description: 'The ultimate growth package',
    features: ['Dominant feed placement', 'Discovery page feature', 'Smart audience targeting'],
  },
];

export default function BoostScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user, refreshUser } = useAuth();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const balance = user?.walletBalance || 0;

  const announceBoosted = (plan: (typeof BOOST_PLANS)[number]) => {
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
  const topUpAndBoost = async (plan: (typeof BOOST_PLANS)[number], shortfall: number) => {
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
        Alert.alert(
          'Add Funds',
          `${plan.label} costs ₹${plan.price} and your wallet has ₹${balance}. Add ₹${shortfall} with Razorpay to continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Pay ₹${shortfall}`,
              onPress: async () => {
                try {
                  setIsProcessing(true);
                  await topUpAndBoost(plan, shortfall);
                } catch (err: any) {
                  Alert.alert('Error', err?.message || 'Failed to boost profile');
                } finally {
                  setIsProcessing(false);
                }
              },
            },
          ]
        );
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


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Boost Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={[colors.primary, '#9C27B0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Zap size={48} color="#000" />
          <Text style={styles.headerTitle}>Skyrocket Your Reach</Text>
          <Text style={styles.headerSubtitle}>
            Boosted profiles get priority placement in the global feed.
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Boosts are paid out of the wallet, so the balance belongs here. */}
          <TouchableOpacity
            style={[styles.balanceRow, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/wallet')}
          >
            <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Wallet balance</Text>
            <Text style={[styles.balanceValue, { color: colors.primary }]}>₹{balance}</Text>
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a Plan</Text>

          {BOOST_PLANS.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              style={[
                styles.planCard,
                { backgroundColor: colors.card, borderColor: colors.border },
                selectedPlan === plan.id && { borderColor: colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.popularText}>BEST VALUE</Text>
                </View>
              )}
              
              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planLabel, { color: colors.text }]}>{plan.label}</Text>
                  <Text style={[styles.planDuration, { color: colors.textSecondary }]}>{plan.duration}</Text>
                </View>
                <Text style={[styles.planPrice, { color: colors.text }]}>₹{plan.price}</Text>
              </View>

              <Text style={[styles.planDesc, { color: colors.textSecondary }]}>{plan.description}</Text>
              
              <View style={styles.featureList}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <CheckCircle2 size={14} color={colors.primary} />
                    <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))}

          <Button
            title={isProcessing ? "Processing..." : "Boost My Profile Now"}
            onPress={handleBoost}
            disabled={!selectedPlan || isProcessing}
            loading={isProcessing}
            style={styles.boostButton}
            size="large"
          />
          
          <View style={styles.infoBox}>
            <TrendingUp size={20} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Users see boosted content 5.4x more often on average.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomLeftRadius: 16,
  },
  popularText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  planDuration: {
    fontSize: 13,
    marginTop: 2,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '900',
  },
  planDesc: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  featureList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 13,
  },
  boostButton: {
    marginTop: 20,
    height: 64,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 32,
    paddingBottom: 40,
  },
  infoText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
