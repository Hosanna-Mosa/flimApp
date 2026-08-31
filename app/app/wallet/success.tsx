import React, { useEffect } from 'react';
import { BackHandler } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Screen from '@/components/layout/Screen';
import Chip from '@/components/ui/Chip';
import PaymentStatusCard from '@/components/wallet/PaymentStatusCard';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { amount, type } = useLocalSearchParams();

  const handleDone = () => {
    // Go back to the wallet screen
    router.replace('/wallet');
  };

  // Prevent back button on Android to avoid going back to razorpay process
  useEffect(() => {
    const backAction = () => {
      handleDone();
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Screen headerShown={false} scroll={false} padded={false}>
      {/* Screen owns the header options; gestureEnabled is the one it does not cover. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      <PaymentStatusCard
        icon={CheckCircle2}
        iconColor={colors.success}
        title="Payment Successful!"
        message={`₹${amount} has been ${type === 'deposit' ? 'added to' : 'withdrawn from'} your wallet.`}
        receipt={[
          { label: 'Transaction Type', value: type === 'deposit' ? 'Wallet Deposit' : 'Wallet Withdrawal' },
          { label: 'Amount', value: `₹${amount}`, bold: true },
          { label: 'Status', value: <Chip label="Completed" tone="success" size="small" /> },
        ]}
        primaryAction={{ label: 'Go to Wallet', onPress: handleDone }}
        secondaryAction={{ label: 'Back to Home', onPress: () => router.replace('/(tabs)/home') }}
      />
    </Screen>
  );
}
