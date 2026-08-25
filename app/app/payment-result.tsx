import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Clock, XCircle } from 'lucide-react-native';

import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { confirmPaymentSession, dismissCheckoutBrowser } from '@/utils/payments';

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
 * from re-checking the session against the server.
 */
export default function PaymentResultScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, refreshUser } = useAuth();
  const params = useLocalSearchParams<{ status?: string; sessionId?: string; reason?: string }>();

  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<'success' | 'failed' | 'cancelled' | 'pending'>(
    params.status === 'success' ? 'success' : params.status === 'failed' ? 'failed' : 'pending'
  );
  const [message, setMessage] = useState<string | undefined>(params.reason);
  const hasChecked = useRef(false);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/verification');
  }, [router]);

  useEffect(() => {
    // The checkout tab may still be sitting on top of the app.
    dismissCheckoutBrowser();
  }, []);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const run = async () => {
      if (params.status === 'cancelled') {
        setStatus('cancelled');
        setChecking(false);
        return;
      }

      if (!params.sessionId || !token) {
        setChecking(false);
        return;
      }

      const session = await confirmPaymentSession(params.sessionId, token, 5);

      if (session?.status === 'PAID') {
        setStatus('success');
        await refreshUser();
      } else if (session?.status === 'FAILED' || session?.status === 'EXPIRED') {
        setStatus('failed');
        setMessage(session.failureReason || message);
      } else if (session?.status === 'CANCELLED') {
        setStatus('cancelled');
      } else {
        setStatus('pending');
      }

      setChecking(false);
    };

    run();
    // Intentionally runs once, guarded by hasChecked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = {
    success: {
      icon: <CheckCircle2 size={72} color={colors.success} />,
      title: 'Payment successful',
      body: 'Your verification badge is now active.',
    },
    failed: {
      icon: <XCircle size={72} color={colors.error} />,
      title: 'Payment failed',
      body: message || 'No money was deducted. You can try again from the verification screen.',
    },
    cancelled: {
      icon: <XCircle size={72} color={colors.textSecondary} />,
      title: 'Payment cancelled',
      body: 'You closed the payment before it completed.',
    },
    pending: {
      icon: <Clock size={72} color={colors.primary} />,
      title: 'Payment processing',
      body: 'We are still confirming this payment with your bank. Your badge will activate automatically once it clears.',
    },
  }[status];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'Payment', headerShown: false }} />

      {checking ? (
        <>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Confirming payment</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Just a moment while we check with the bank.
          </Text>
        </>
      ) : (
        <>
          {copy.icon}
          <Text style={[styles.title, { color: colors.text }]}>{copy.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{copy.body}</Text>
          <Button title="Continue" onPress={goBack} style={styles.button} size="large" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 24,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    textAlign: 'center',
  },
  button: {
    marginTop: 32,
    width: '100%',
  },
});
