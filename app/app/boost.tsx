import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Screen from '@/components/layout/Screen';
import Section from '@/components/layout/Section';
import { useBoostCheckout } from '@/hooks/useBoostCheckout';
import BoostHero from '@/components/boost/BoostHero';
import WalletBalanceRow from '@/components/boost/WalletBalanceRow';
import BoostPlanCard from '@/components/boost/BoostPlanCard';
import BoostButton from '@/components/boost/BoostButton';
import BoostFootnote from '@/components/boost/BoostFootnote';

export default function BoostScreen() {
  const router = useRouter();
  const b = useBoostCheckout();

  return (
    <Screen title="Boost Profile" padded={false}>
      <BoostHero />

      <View style={{ padding: 20 }}>
        {/* Boosts are paid out of the wallet, so the balance belongs here. */}
        <WalletBalanceRow balance={b.balance} onPress={() => router.push('/wallet')} />

        <Section title="Select a Plan">
          {b.plans.map((plan) => (
            <BoostPlanCard
              key={plan.id}
              plan={plan}
              selected={b.selectedPlan === plan.id}
              onPress={() => b.setSelectedPlan(plan.id)}
            />
          ))}
        </Section>

        <BoostButton enabled={!!b.selectedPlan} processing={b.isProcessing} onPress={b.handleBoost} />

        <BoostFootnote />
      </View>
    </Screen>
  );
}
