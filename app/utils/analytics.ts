import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Event tracking.
 *
 * Events go two places, deliberately:
 *
 *   Firebase   — sessions, funnels, retention, and the demographic breakdowns
 *                Google can infer. Good dashboards, none of the data is ours.
 *   Our server — the same events in our own database, charted on the admin
 *                Analytics page beside reports, support and payments.
 *
 * Sending both is not redundant. Firebase answers "how does this compare with
 * last month" well; our own copy is the one we can join against a user record
 * when someone raises a support ticket, and the one that still exists if the
 * Firebase project is ever lost or the free tier stops being enough.
 *
 * Nothing here ever throws. A failed analytics call must never reach a screen.
 */

const API_BASE = Constants.expoConfig?.extra?.apiUrl;
const APP_VERSION = Constants.expoConfig?.version ?? 'unknown';

/** Must stay in sync with ALLOWED_EVENTS in the backend controller — the
 *  server drops anything it does not recognise. */
export type AnalyticsEventName =
  | 'screen_view'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'post_create_started'
  | 'post_create_failed'
  | 'search_performed'
  | 'profile_viewed'
  | 'checkout_started'
  | 'checkout_abandoned'
  | 'verification_started'
  | 'app_opened';

type Props = Record<string, string | number | boolean | undefined>;

/** Identifies one app run. Regenerated on launch, never persisted, so it
 *  groups a session without becoming a durable device identifier. */
const SESSION_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const platform: 'ios' | 'android' | 'web' =
  Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

// ---------------------------------------------------------------------------
// Firebase, loaded lazily
// ---------------------------------------------------------------------------

// Required so the app still runs in Expo Go and on web, where the native
// Firebase modules do not exist. A missing SDK disables Firebase reporting
// rather than crashing on import.
let firebaseAnalytics: any = null;
let firebaseCrashlytics: any = null;
let firebaseChecked = false;

const loadFirebase = () => {
  if (firebaseChecked) return;
  firebaseChecked = true;
  if (platform === 'web') return;
  try {
    firebaseAnalytics = require('@react-native-firebase/analytics').default();
    firebaseCrashlytics = require('@react-native-firebase/crashlytics').default();
  } catch {
    // Expo Go, or a build without the native modules. Everything below no-ops.
  }
};

// ---------------------------------------------------------------------------
// Batching to our own backend
// ---------------------------------------------------------------------------

type QueuedEvent = {
  name: AnalyticsEventName;
  props?: Props;
  sessionId: string;
  platform: string;
  appVersion: string;
  at: number;
};

const queue: QueuedEvent[] = [];
const FLUSH_AFTER_MS = 10_000;
const FLUSH_AT_COUNT = 20;
const MAX_QUEUE = 100;

let flushTimer: ReturnType<typeof setTimeout> | null = null;
let authToken: string | undefined;

/** Called after sign-in so events can be attributed. */
export const setAnalyticsToken = (token?: string) => {
  authToken = token;
};

const flush = async () => {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (queue.length === 0 || !API_BASE) return;

  const batch = queue.splice(0, queue.length);
  try {
    await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // Put them back so a flaky connection does not lose the batch, but never
    // let the queue grow without bound — dropping the oldest is better than
    // holding memory for a device that has been offline for hours.
    queue.unshift(...batch.slice(-MAX_QUEUE));
    if (queue.length > MAX_QUEUE) queue.splice(0, queue.length - MAX_QUEUE);
  }
};

const scheduleFlush = () => {
  if (queue.length >= FLUSH_AT_COUNT) {
    void flush();
    return;
  }
  if (!flushTimer) flushTimer = setTimeout(() => void flush(), FLUSH_AFTER_MS);
};

// ---------------------------------------------------------------------------
// Public surface
// ---------------------------------------------------------------------------

/** Record an event. Fire and forget — never await this in a UI path. */
export const track = (name: AnalyticsEventName, props?: Props) => {
  try {
    loadFirebase();

    if (firebaseAnalytics) {
      // Firebase rejects undefined values, so they are stripped rather than sent.
      const clean = props
        ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
        : undefined;
      void firebaseAnalytics.logEvent(name, clean).catch(() => {});
    }

    queue.push({
      name,
      props,
      sessionId: SESSION_ID,
      platform,
      appVersion: APP_VERSION,
      at: Date.now(),
    });
    if (queue.length > MAX_QUEUE) queue.shift();
    scheduleFlush();
  } catch {
    // Analytics must never surface an error to the caller.
  }
};

/** Screen views, reported to Firebase in the shape its funnels expect. */
export const trackScreen = (screenName: string) => {
  try {
    loadFirebase();
    if (firebaseAnalytics) {
      void firebaseAnalytics
        .logScreenView({ screen_name: screenName, screen_class: screenName })
        .catch(() => {});
    }
    track('screen_view', { screen: screenName });
  } catch {
    /* ignore */
  }
};

/**
 * Attach the signed-in user to future reports.
 *
 * Only the id is sent. Name, email and phone are deliberately withheld — they
 * would end up in Google's copy of the data, which widens what has to be
 * declared on the App Store privacy label for no analytical gain.
 */
export const identify = (userId?: string) => {
  try {
    loadFirebase();
    if (firebaseAnalytics) void firebaseAnalytics.setUserId(userId ?? null).catch(() => {});
    if (firebaseCrashlytics) void firebaseCrashlytics.setUserId(userId ?? '').catch(() => {});
  } catch {
    /* ignore */
  }
};

/** Report a handled error to Crashlytics. Unhandled crashes are caught for us. */
export const reportError = (error: unknown, context?: string) => {
  try {
    loadFirebase();
    if (!firebaseCrashlytics) return;
    if (context) firebaseCrashlytics.log(context);
    firebaseCrashlytics.recordError(
      error instanceof Error ? error : new Error(String(error))
    );
  } catch {
    /* ignore */
  }
};

/** Send anything queued — call when the app goes to the background. */
export const flushAnalytics = () => void flush();
