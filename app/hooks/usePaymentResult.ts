import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Clock, LucideIcon, XCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { confirmPaymentSession, dismissCheckoutBrowser, PaymentStatus } from '@/utils/payments';

export interface PaymentOutcomeCopy {
  icon: LucideIcon;
  color: string;
  title: string;
  body: string;
}

/**
 * Payment-result deep-link logic: dismisses any lingering checkout tab, then
 * confirms the session against the server exactly once. The query string is
 * only a hint; the final status comes from the server.
 */
export function usePaymentResult() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, refreshUser } = useAuth();
  const params = useLocalSearchParams<{ status?: string; sessionId?: string; reason?: string }>();

  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<PaymentStatus>(
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

  const outcome: PaymentOutcomeCopy = {
    success: {
      icon: CheckCircle2,
      color: colors.success,
      title: 'Payment successful',
      body: 'Your verification badge is now active.',
    },
    failed: {
      icon: XCircle,
      color: colors.error,
      title: 'Payment failed',
      body: message || 'No money was deducted. You can try again from the verification screen.',
    },
    cancelled: {
      icon: XCircle,
      color: colors.textSecondary,
      title: 'Payment cancelled',
      body: 'You closed the payment before it completed.',
    },
    pending: {
      icon: Clock,
      color: colors.primary,
      title: 'Payment processing',
      body: 'We are still confirming this payment with your bank. Your badge will activate automatically once it clears.',
    },
  }[status];

  return { checking, status, outcome, goBack };
}
