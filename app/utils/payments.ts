import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { api, PaymentSessionStatus } from '@/utils/api';

/**
 * Razorpay **web** checkout — the only payment path in this app, on iOS and
 * Android alike.
 *
 * There is no Razorpay native SDK and no in-app WebView here on purpose:
 *
 *  - The system browser (Chrome Custom Tabs / SFSafariViewController) is the
 *    only surface that can hand off to UPI apps via `intent://` and `upi://`,
 *    which is how most Indian payments actually complete. An embedded WebView
 *    silently dead-ends on those.
 *  - Card autofill, bank OTP pages and saved-card cookies all live in the real
 *    browser.
 *  - Nothing about the payment is trusted from the client. The browser comes
 *    back with a hint in the deep link; the app then asks the backend what
 *    happened and believes only that.
 *
 * Flow:
 *   createPaymentSession -> openAuthSessionAsync(checkoutUrl, returnUrl)
 *     -> browser deep-links back -> poll /payments/session/:id -> outcome
 */

export const PAYMENT_RETURN_PATH = 'payment-result';

export type PaymentStatus = 'success' | 'failed' | 'cancelled' | 'pending';

export interface PaymentOutcome {
  status: PaymentStatus;
  sessionId: string;
  /** Human-readable reason for a non-success outcome. */
  reason?: string;
  /** Authoritative server-side session record, when it could be fetched. */
  session?: PaymentSessionStatus;
}

export interface StartCheckoutParams {
  token: string;
  purpose?: 'SUBSCRIPTION' | 'WALLET';
  /** Required for SUBSCRIPTION. */
  planType?: string;
  /** Required for WALLET, in rupees. */
  amount?: number;
  /** Custom Tabs toolbar tint on Android. */
  themeColor?: string;
}

const POLL_INTERVAL_MS = 1500;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The URL the browser is sent back to. expo-linking resolves this per
 * environment: `myapp://payment-result` in a build, `exp://<lan-ip>:8081/--/
 * payment-result` under Expo Go. Both are allow-listed by the backend.
 */
export const getPaymentReturnUrl = () => Linking.createURL(PAYMENT_RETURN_PATH);

const parseReturnUrl = (url: string): { status?: string; sessionId?: string; reason?: string } => {
  try {
    const { queryParams } = Linking.parse(url);
    return {
      status: queryParams?.status as string | undefined,
      sessionId: queryParams?.sessionId as string | undefined,
      reason: queryParams?.reason as string | undefined,
    };
  } catch {
    return {};
  }
};

/**
 * Asks the backend what happened, retrying while the session is still open.
 *
 * A session can legitimately sit at CREATED for a moment after the user
 * returns: the browser callback and the Razorpay webhook both race to fulfil
 * it. Polling a few times avoids reporting "cancelled" for a payment that lands
 * a second later.
 */
export const confirmPaymentSession = async (
  sessionId: string,
  token: string,
  attempts = 5
): Promise<PaymentSessionStatus | null> => {
  let last: PaymentSessionStatus | null = null;

  for (let i = 0; i < attempts; i++) {
    try {
      last = await api.getPaymentSession(sessionId, token);
      if (last && last.status !== 'CREATED') return last;
    } catch (err) {
      console.warn('[Payments] Status check failed:', err);
    }
    if (i < attempts - 1) await sleep(POLL_INTERVAL_MS);
  }

  return last;
};

const toOutcome = (
  sessionId: string,
  session: PaymentSessionStatus | null,
  fallbackReason?: string
): PaymentOutcome => {
  switch (session?.status) {
    case 'PAID':
      return { status: 'success', sessionId, session };
    case 'FAILED':
      return {
        status: 'failed',
        sessionId,
        session,
        reason: session.failureReason || fallbackReason || 'Payment failed',
      };
    case 'CANCELLED':
      return { status: 'cancelled', sessionId, session, reason: 'Payment cancelled' };
    case 'EXPIRED':
      return { status: 'failed', sessionId, session, reason: 'Payment session expired' };
    default:
      // Still CREATED, or the status call never succeeded. The payment may yet
      // be confirmed by the webhook, so this is deliberately not "failed".
      return {
        status: 'pending',
        sessionId,
        session: session || undefined,
        reason: fallbackReason,
      };
  }
};

/**
 * Opens Razorpay's hosted checkout in the system browser and resolves once the
 * outcome is known to the server.
 */
export const startRazorpayWebCheckout = async ({
  token,
  purpose = 'SUBSCRIPTION',
  planType,
  amount,
  themeColor = '#D4AF37',
}: StartCheckoutParams): Promise<PaymentOutcome> => {
  const returnUrl = getPaymentReturnUrl();

  const session = await api.createPaymentSession(
    { purpose, planType, amount, returnUrl },
    token
  );

  if (!session?.checkoutUrl || !session?.sessionId) {
    throw new Error('Could not start checkout. Please try again.');
  }

  let browserResult: WebBrowser.WebBrowserAuthSessionResult;
  try {
    browserResult = await WebBrowser.openAuthSessionAsync(session.checkoutUrl, returnUrl, {
      // Keep the tab in the recents switcher: bank OTP flows often bounce the
      // user through an SMS app and back.
      showInRecents: true,
      // Reuse existing browser cookies so saved cards and bank logins work.
      preferEphemeralSession: false,
      toolbarColor: '#0B0B0B',
      controlsColor: themeColor,
      showTitle: false,
      enableBarCollapsing: false,
    });
  } catch (err) {
    console.error('[Payments] Failed to open checkout browser:', err);
    // The order exists server-side; let the status check decide.
    const confirmed = await confirmPaymentSession(session.sessionId, token, 2);
    return toOutcome(session.sessionId, confirmed, 'Could not open the payment page');
  }

  // The hint the browser came back with. Never trusted on its own — it only
  // decides how hard to poll before giving up.
  const hint =
    browserResult.type === 'success' && browserResult.url
      ? parseReturnUrl(browserResult.url)
      : {};

  // If the redirect fired we expect the server to already know; if the user
  // just closed the tab, give the webhook a little longer to arrive.
  const attempts = hint.status === 'success' ? 6 : hint.status ? 2 : 4;
  const confirmed = await confirmPaymentSession(session.sessionId, token, attempts);

  return toOutcome(session.sessionId, confirmed, hint.reason);
};

/**
 * Closes any checkout tab still showing. Safe to call unconditionally — needed
 * when a deep link resumes the app while the browser sheet is still on screen
 * (iOS Expo Go, and Android when the redirect is handled by the OS rather than
 * intercepted by the auth session).
 */
export const dismissCheckoutBrowser = () => {
  try {
    if (Platform.OS !== 'web') WebBrowser.dismissBrowser();
  } catch {
    // No browser open — nothing to do.
  }
};
