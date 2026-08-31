import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationRoute {
  pathname: string;
  params?: Record<string, string>;
}

/**
 * Maps a notification (push `data` payload or in-app notification
 * `{ type, ...metadata }`) to the screen it should open. Single source of
 * truth for both the push-tap handler and the Notifications screen.
 *
 * Backend types: chat (push only), message, like, comment, reply, share,
 * follow, follow_request, follow_request_accepted, follow_request_rejected,
 * boost_expiring, boost_expired.
 */
export function getNotificationRoute(data: Record<string, any> | null | undefined): NotificationRoute | null {
  if (!data || !data.type) return null;
  const type = String(data.type);
  const actorId = data.actorId || data.senderId || data.followerId || data.acceptedBy;
  const postId = data.postId;

  switch (type) {
    case 'chat':
    case 'message':
      return actorId ? { pathname: '/chat', params: { userId: String(actorId) } } : null;

    case 'like':
    case 'comment':
    case 'reply':
    case 'share':
      return postId ? { pathname: '/post/[id]', params: { id: String(postId) } } : null;

    case 'follow':
    case 'follow_request':
    case 'follow_request_accepted':
    case 'follow_request_rejected':
      return actorId ? { pathname: '/user/[id]', params: { id: String(actorId) } } : null;

    case 'boost_expiring':
    case 'boost_expired':
      return { pathname: '/boost' };

    default:
      return null;
  }
}

// ---- Pending deep link (cold start) -------------------------------------
// A push tapped while the app is closed arrives before auth has resolved and
// before the splash screen's own redirect to /home; navigating immediately
// gets overwritten. The route is parked here and consumed by the splash
// screen once it has landed on /home.

let pendingRoute: NotificationRoute | null = null;

export function setPendingNotificationRoute(route: NotificationRoute | null) {
  pendingRoute = route;
}

export function consumePendingNotificationRoute(): NotificationRoute | null {
  const r = pendingRoute;
  pendingRoute = null;
  return r;
}

// getLastNotificationResponseAsync can return the same response again on a
// later cold start (Android keeps the launch intent), so remember what we
// already handled.
const HANDLED_KEY = 'push:lastHandledResponseId';

export async function wasResponseHandled(identifier: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(HANDLED_KEY)) === identifier;
  } catch {
    return false;
  }
}

export async function markResponseHandled(identifier: string): Promise<void> {
  try {
    await AsyncStorage.setItem(HANDLED_KEY, identifier);
  } catch {
    // best effort
  }
}
