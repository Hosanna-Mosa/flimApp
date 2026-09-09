import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ShareIntent } from 'expo-share-intent';

/**
 * Content handed to the app by the OS share sheet, normalised to the shape the
 * chat screens already speak (`uri` / `kind` / `name`), so a shared file can go
 * through the same upload path as one picked from the library.
 */
export interface SharedFile {
  /** `file://` path (Android copies content:// streams into the cache first). */
  uri: string;
  kind: 'image' | 'video';
  name: string;
  mimeType?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface IncomingShare {
  /** Derived from the content, so the same intent is never acted on twice. */
  id: string;
  /** Text or link shared as text/plain. */
  text?: string;
  /** The http(s) link inside `text`, when there is one (Instagram posts/reels). */
  webUrl?: string;
  files: SharedFile[];
  receivedAt: number;
}

const kindFor = (mimeType?: string | null): 'image' | 'video' | null => {
  if (!mimeType) return null;
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
};

const signatureOf = (text: string | undefined, files: SharedFile[]) =>
  [text ?? '', ...files.map((f) => `${f.uri}:${f.size ?? ''}`)].join('|');

/**
 * expo-share-intent's payload → ours. Anything that is not an image or a video
 * is dropped: only those two have a place in a message, and the manifest only
 * advertises those MIME types, so a third kind means something went wrong
 * upstream rather than something we should try to send.
 */
export function normalizeShareIntent(shareIntent: ShareIntent | null | undefined): IncomingShare | null {
  if (!shareIntent) return null;

  const files: SharedFile[] = (shareIntent.files ?? []).reduce<SharedFile[]>((acc, file) => {
    const kind = kindFor(file?.mimeType);
    if (!kind || !file?.path) return acc;
    return [
      ...acc,
      {
        uri: file.path,
        kind,
        name: file.fileName || `shared-${Date.now()}-${acc.length}.${kind === 'video' ? 'mp4' : 'jpg'}`,
        mimeType: file.mimeType ?? undefined,
        size: file.size ?? undefined,
        width: file.width ?? undefined,
        height: file.height ?? undefined,
        duration: file.duration ?? undefined,
      },
    ];
  }, []);

  const text = shareIntent.text?.trim() || undefined;
  if (!text && files.length === 0) return null;

  return {
    id: signatureOf(text, files),
    text,
    // Instagram shares a permalink rather than the media itself. It is kept as
    // a link and never fetched — downloading someone's post because it passed
    // through the share sheet is not something the user asked for.
    webUrl: shareIntent.webUrl || undefined,
    files,
    receivedAt: Date.now(),
  };
}

// ---- Parked share (waiting for auth, or for the splash to finish) ---------
// A share can arrive before the app is in any state to act on it: auth has not
// resolved, the user is signed out, or the splash screen is about to
// router.replace() over anything we push. It is parked here until the app is
// ready, mirroring how notificationRouting parks a tapped push.
//
// Persisted as well as held in memory because the signed-out case sends the
// user through sign-in — and on Android sign-up leaves the app for the SMS —
// which the process may not survive.

const PENDING_KEY = 'share:pending';
/** Older than this and the user has moved on; the cache file may be gone too. */
const PENDING_TTL_MS = 30 * 60 * 1000;

let pendingShare: IncomingShare | null = null;

export async function setPendingShare(share: IncomingShare): Promise<void> {
  pendingShare = share;
  try {
    await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(share));
  } catch {
    // Best effort: the in-memory copy still covers everything but a restart.
  }
}

export async function clearPendingShare(): Promise<void> {
  pendingShare = null;
  try {
    await AsyncStorage.removeItem(PENDING_KEY);
  } catch {
    // best effort
  }
}

/** Returns the parked share and forgets it. Expired ones are dropped. */
export async function consumePendingShare(): Promise<IncomingShare | null> {
  let share = pendingShare;

  if (!share) {
    try {
      const stored = await AsyncStorage.getItem(PENDING_KEY);
      if (stored) share = JSON.parse(stored) as IncomingShare;
    } catch {
      share = null;
    }
  }

  await clearPendingShare();

  if (!share) return null;
  if (Date.now() - share.receivedAt > PENDING_TTL_MS) return null;
  return share;
}

// ---- Duplicate suppression ----------------------------------------------
// Android keeps the intent that launched an activity. If the process is killed
// and the task is resumed from Recents, MainActivity is recreated with the
// original share intent still attached and the same share is delivered again —
// the app reopens on the picker for something the user already sent. The same
// hazard the notification code guards against, guarded the same way.
//
// The window is deliberately short: sharing the same photo again half an hour
// later is a real thing to do, and must not be mistaken for a replay.

const HANDLED_KEY = 'share:lastHandled';
const HANDLED_WINDOW_MS = 10 * 60 * 1000;

export async function wasShareHandled(id: string): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(HANDLED_KEY);
    if (!stored) return false;
    const last = JSON.parse(stored) as { id: string; at: number };
    return last.id === id && Date.now() - last.at < HANDLED_WINDOW_MS;
  } catch {
    return false;
  }
}

export async function markShareHandled(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(HANDLED_KEY, JSON.stringify({ id, at: Date.now() }));
  } catch {
    // best effort
  }
}

// ---- Hand-off between screens -------------------------------------------
// The share travels in memory with a token in the route params, rather than in
// the params themselves: a video URI plus its metadata does not belong in a
// URL. Reading is by token and idempotent, so a screen that re-mounts (or a
// StrictMode double-render) sees the same content instead of an empty screen.

let staged: { token: string; share: IncomingShare } | null = null;

/** Parks `share` for the next screen and returns the token that fetches it. */
export function stageShare(share: IncomingShare): string {
  // Unique per hand-off, so sharing the same content into a second chat still
  // reads as new content to the receiving screen.
  const token = `${share.id}#${Date.now()}`;
  staged = { token, share };
  return token;
}

export function readStagedShare(token: string | undefined | null): IncomingShare | null {
  if (!token || staged?.token !== token) return null;
  return staged.share;
}

// ---- Navigation readiness ------------------------------------------------
// The splash screen replaces the whole stack once auth resolves. Anything
// pushed before that is thrown away, so the share flow waits for it.

let navigationReady = false;

export function markShareNavigationReady(): void {
  navigationReady = true;
}

export function isShareNavigationReady(): boolean {
  return navigationReady;
}
