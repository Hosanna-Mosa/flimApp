import { getDeepLinkRoute, isDeepLinkNavigationReady } from '@/utils/deepLinks';
import { setPendingNotificationRoute } from '@/utils/notificationRouting';

/**
 * First look at every URL the OS hands the app, before expo-router routes it.
 *
 * Left alone, a shared link opens its screen directly and skips everything
 * index.tsx does on launch: the session is never checked, so a signed-out
 * visitor lands on a post, and there is no stack underneath, so the back
 * gesture closes the app instead of going anywhere. So a link we recognise is
 * parked and the launch is sent through the splash as normal; the home screen
 * opens the parked route once it is mounted (see usePendingRoute) — the same
 * path a notification tapped on a closed app already takes.
 *
 * Anything we do not recognise is returned untouched. The Razorpay return
 * (`filmyconnect://payment-result`) and expo-share-intent's URLs come through
 * here too and already have handlers of their own.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string {
  try {
    const route = getDeepLinkRoute(path);
    if (!route) return path;

    // Warm start with home already mounted: expo-router can navigate straight
    // there, and pushing onto the live stack keeps the back gesture working.
    if (!initial && isDeepLinkNavigationReady()) return path;

    setPendingNotificationRoute(route);
    return '/';
  } catch {
    // A thrown error here becomes a failed launch. A link that opens the app
    // on the wrong screen is a far smaller problem than one that does not open
    // it at all.
    return path;
  }
}
