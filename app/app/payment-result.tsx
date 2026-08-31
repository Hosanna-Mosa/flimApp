import React from 'react';
import { Clock } from 'lucide-react-native';

import Screen from '@/components/layout/Screen';
import PaymentStatusCard from '@/components/wallet/PaymentStatusCard';
import { useTheme } from '@/contexts/ThemeContext';
import { usePaymentResult } from '@/hooks/usePaymentResult';

/**
 * Landing screen for the `myapp://payment-result` deep link that Razorpay's
 * hosted checkout sends the browser to.
 *
 * In the normal flow this screen is never seen: openAuthSessionAsync intercepts
 * the redirect inside utils/payments.ts and resolves there. This exists for the
 * cases where the OS routes the deep link to the app instead — a cold start
 * from the browser, Expo Go (which cannot claim the redirect), or the user
 * tapping "Return to app" manually. Without it the redirect lands on +not-found
 * and the user is left believing the payment vanished.
 *
 * Like everywhere else, the query string is only a hint; the badge state comes
 * from re-checking the session against the server (see usePaymentResult).
 */
export default function PaymentResultScreen() {
  const { colors } = useTheme();
  const r = usePaymentResult();

  return (
    <Screen headerShown={false} scroll={false} padded={false}>
      {r.checking ? (
        <PaymentStatusCard
          loading
          icon={Clock}
          iconColor={colors.primary}
          title="Confirming payment"
          message="Just a moment while we check with the bank."
        />
      ) : (
        <PaymentStatusCard
          icon={r.outcome.icon}
          iconColor={r.outcome.color}
          title={r.outcome.title}
          message={r.outcome.body}
          primaryAction={{ label: 'Continue', onPress: r.goBack }}
        />
      )}
    </Screen>
  );
}
