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
 *
 * Ad-related collection is switched off in firebase.json — the advertising
 * identifier, ad personalisation signals, ad storage and SKAdNetwork. The app
 * runs no ads, so the identifier buys nothing, and collecting it is what
 * obliges the App Tracking Transparency prompt. That reasoning lives here
 * rather than in firebase.json because react-native-firebase parses that file
 * by interpolating it into a single-quoted Ruby string, so one apostrophe in a
 * comment fails the iOS build.
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
/**
 * React Native Firebase v22 removed the callable default export. v26 is modular
 * only: you take an instance from getAnalytics() and pass it to standalone
 * functions. Calling `.default()` — the old namespaced style — throws
 * "undefined is not a function", and because every call here is wrapped in a
 * try/catch that silence was indistinguishable from "not installed". Nothing
 * this module sent ever reached Firebase; what appeared in GA4 was Firebase's
 * own automatic collection.
 */
type FirebaseModules = {
  analytics: any;
  crashlytics: any;
  a: typeof import('@react-native-firebase/analytics');
  c: typeof import('@react-native-firebase/crashlytics');
};

let firebase: FirebaseModules | null = null;
let firebaseChecked = false;

/**
 * Expo Go ships a fixed set of native modules and Firebase is not among them,
 * so `NativeRNFBTurboApp is not registered` there is expected rather than a
 * fault. Warning about it on every reload trains people to ignore the warning,
 * which is exactly what let the previous breakage go unnoticed — so it is only
 * reported in a build that is supposed to have Firebase compiled in.
 */
const isExpoGo = Constants.executionEnvironment === 'storeClient';

const loadFirebase = () => {
  if (firebaseChecked) return;
  firebaseChecked = true;
  if (platform === 'web' || isExpoGo) return;
  try {
    const a = require('@react-native-firebase/analytics');
    const c = require('@react-native-firebase/crashlytics');
    firebase = {
      a,
      c,
      analytics: a.getAnalytics(),
      crashlytics: c.getCrashlytics(),
    };
  } catch (err) {
    // A real build reaching here means the native side did not link. Worth
    // saying loudly: the last time this failed silently, nothing reported to
    // Firebase for an entire release and it looked like a display bug.
    console.warn(
      '[analytics] Firebase native modules missing in a build that should have them. ' +
        'Events go to the backend only. Cause:',
      err
    );
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

    // screen_view is reserved by Firebase and rejected by logEvent — it has to
    // go through logScreenView, which trackScreen already does. Sending it here
    // as well would double-count every screen.
    if (firebase && name !== 'screen_view') {
      // Firebase rejects undefined values, so they are stripped rather than sent.
      const clean = props
        ? Object.fromEntries(Object.entries(props).filter(([, v]) => v !== undefined))
        : undefined;
      firebase.a.logEvent(firebase.analytics, name, clean);
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
    if (firebase) {
      firebase.a.logScreenView(firebase.analytics, {
        screen_name: screenName,
        screen_class: screenName,
      });
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
    if (firebase) {
      firebase.a.setUserId(firebase.analytics, userId ?? null);
      firebase.c.setUserId(firebase.crashlytics, userId ?? '');
    }
  } catch {
    /* ignore */
  }
};

/** Report a handled error to Crashlytics. Unhandled crashes are caught for us. */
export const reportError = (error: unknown, context?: string) => {
  try {
    loadFirebase();
    if (!firebase) return;
    if (context) firebase.c.log(firebase.crashlytics, context);
    firebase.c.recordError(
      firebase.crashlytics,
      error instanceof Error ? error : new Error(String(error))
    );
  } catch {
    /* ignore */
  }
};

/** Send anything queued — call when the app goes to the background. */
export const flushAnalytics = () => void flush();
