import type { NotificationRoute } from '@/utils/notificationRouting';

/**
 * Links that point *into* the app.
 *
 * Shared links are plain https URLs on filmyconnect24.com rather than
 * `filmyconnect://` ones, because a custom scheme is not a link anywhere it
 * matters: WhatsApp and Instagram will not make it tappable, a browser cannot
 * open it, and on a phone without the app it fails silently. An https URL is
 * tappable everywhere, opens the app directly when it is installed (iOS
 * Universal Links / Android App Links, which the two files under
 * /.well-known/ on the domain authorise), and otherwise lands on a page
 * showing the post with a link to the store.
 *
 * The paths here are one half of a contract with the server: they have to
 * match the Express routes in backend/server/src/routes/deeplink.routes.js and
 * the intent filters in app.json, or a link opens a browser with no sign that
 * anything is wrong.
 */
const SHARE_ORIGIN = 'https://filmyconnect24.com';

/** The URL to hand to the OS share sheet for a post. */
export const buildPostShareUrl = (postId: string): string =>
  `${SHARE_ORIGIN}/post/${encodeURIComponent(postId)}`;

/**
 * An incoming link → the screen it opens, or null if it is not ours to handle.
 *
 * Returning null matters as much as returning a route: the same entry point
 * sees the Razorpay return (`filmyconnect://payment-result`) and the URLs
 * expo-share-intent uses, and those must pass through untouched to the
 * handlers that already own them.
 */
export function getDeepLinkRoute(url: string | null | undefined): NotificationRoute | null {
  if (!url) return null;

  let path = url;

  // Accept whatever form the platform hands over: a full https URL, a
  // `filmyconnect://post/1` scheme URL, or the bare path expo-router extracts.
  const schemeMatch = /^([a-z][a-z0-9+.-]*):\/\//i.exec(path);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    const afterScheme = path.slice(schemeMatch[0].length);

    if (scheme === 'http' || scheme === 'https') {
      // A real host to drop; a URL with no path at all leaves us with ''.
      const slash = afterScheme.indexOf('/');
      path = slash === -1 ? '' : afterScheme.slice(slash);
    } else {
      // A custom scheme has no host — `filmyconnect://post/1` means the path
      // `/post/1`, and treating `post` as a hostname would silently eat the
      // segment that says which screen to open. Expo Go is the exception: it
      // puts a real host and port before a `/--/` marker.
      const marker = afterScheme.indexOf('/--/');
      path = marker === -1 ? `/${afterScheme}` : afterScheme.slice(marker + 3);
    }
  }

  // A dev-client path can still arrive already stripped of its scheme.
  path = path.replace(/^\/--/, '');
  // Query and fragment carry nothing we route on.
  path = path.split('?')[0].split('#')[0];

  const post = /^\/post\/([^/]+)\/?$/.exec(path);
  if (post) return { pathname: '/post/[id]', params: { id: decodeURIComponent(post[1]) } };

  const user = /^\/user\/([^/]+)\/?$/.exec(path);
  if (user) return { pathname: '/user/[id]', params: { id: decodeURIComponent(user[1]) } };

  return null;
}

// ---- Navigation readiness ------------------------------------------------
// Whether a link can be followed on the spot. It cannot during launch: the
// splash replaces the whole stack once auth resolves, so anything pushed
// before that is thrown away, and a link tapped by someone signed out has to
// go through sign-in rather than open a post to a stranger. Set by the home
// screen on mount, which is the one state where both are settled.

let navigationReady = false;

export function markDeepLinkNavigationReady(): void {
  navigationReady = true;
}

export function isDeepLinkNavigationReady(): boolean {
  return navigationReady;
}
