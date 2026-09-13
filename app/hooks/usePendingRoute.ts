import { useEffect } from 'react';
import { router } from 'expo-router';
import { consumePendingNotificationRoute } from '@/utils/notificationRouting';
import { markDeepLinkNavigationReady } from '@/utils/deepLinks';

/**
 * Opens the route parked while the app had nowhere to put it — a notification
 * tapped on a closed app, or a shared filmyconnect24.com link — on top of home.
 *
 * Home owns this rather than the splash screen because it is the one place
 * every route into the app converges on. The splash is not: signing in ends
 * with its own `router.replace('/home')` from the auth screens, so a link
 * tapped while signed out would otherwise be parked, survive the sign-in, and
 * then be silently dropped.
 *
 * The store is one-shot, so switching tabs and coming back does not reopen
 * something the user has already read and navigated away from.
 */
export function usePendingRoute() {
  useEffect(() => {
    // Home is mounted, so there is a stack for the pushed screen to sit on and
    // for its back gesture to land on.
    markDeepLinkNavigationReady();

    const pending = consumePendingNotificationRoute();
    if (!pending) return;

    // A push issued in the same frame as the navigation that mounted this
    // screen can be dropped; a tick of breathing room is enough.
    const timer = setTimeout(() => router.push(pending as any), 400);
    return () => clearTimeout(timer);
  }, []);
}
