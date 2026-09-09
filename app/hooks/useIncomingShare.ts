import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { useShareIntentContext } from 'expo-share-intent';
import { useAuth } from '@/contexts/AuthContext';
import {
  IncomingShare,
  consumePendingShare,
  isShareNavigationReady,
  markShareHandled,
  normalizeShareIntent,
  setPendingShare,
  stageShare,
  wasShareHandled,
} from '@/utils/shareIntent';

/** Opens the "Share to" picker with `share` parked for it to read. */
export function openShareTargetPicker(share: IncomingShare) {
  router.push({ pathname: '/share', params: { shareToken: stageShare(share) } });
}

/**
 * Content arriving from the OS share sheet.
 *
 * Mounted once, at the root. Two things have to be true before the picker can
 * open: the user is signed in and past onboarding, and the splash screen has
 * finished replacing the stack. Until then the share is parked (see
 * utils/shareIntent) rather than dropped — a share is the reason the app was
 * opened at all, so losing it to a sign-in is losing the whole interaction.
 *
 * Nothing is ever sent from here. The picker leads to the normal chat screen
 * with the content staged in its composer, and the user presses Send.
 */
export function useIncomingShare() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();
  const { shareIntent, hasShareIntent, resetShareIntent } = useShareIntentContext();

  const lastHandled = useRef<{ id: string; at: number } | null>(null);
  const canOpen = !isLoading && isAuthenticated && hasCompletedOnboarding;

  // ---- Receive. Covers both a cold start (the launch intent, read by the
  // native module on create) and the app already running (onNewIntent).
  useEffect(() => {
    if (!hasShareIntent) return;

    const share = normalizeShareIntent(shareIntent);
    if (!share) return;

    // Within the same session, the module re-reads the intent on every
    // foreground, so the same content can arrive several times in a row.
    const now = Date.now();
    if (lastHandled.current?.id === share.id && now - lastHandled.current.at < 3000) return;
    lastHandled.current = { id: share.id, at: now };

    // Clear it natively too, so the next foreground does not replay it.
    resetShareIntent();

    // Deliberately not cancelled on cleanup. resetShareIntent() above flips
    // hasShareIntent, which tears this effect down in the very next render —
    // cancelling on that would abandon the share we just took responsibility
    // for. This hook is mounted at the root and lives as long as the app.
    (async () => {
      // Across sessions: the same share coming back because the task was
      // resumed from Recents with its original launch intent.
      if (await wasShareHandled(share.id)) return;
      await markShareHandled(share.id);

      if (canOpen && isShareNavigationReady()) {
        openShareTargetPicker(share);
      } else {
        await setPendingShare(share);
      }
    })().catch((err) => console.error('[share] Could not handle the incoming share:', err));
  }, [hasShareIntent, shareIntent, canOpen, resetShareIntent]);

  // ---- Release a parked share once the app can act on it: the user finished
  // signing in, or finished onboarding. The cold-start case is handled by the
  // splash screen instead, which owns the stack until it has redirected.
  useEffect(() => {
    if (!canOpen) return;

    let cancelled = false;
    // Sign-in and onboarding both router.replace('/home') as they complete;
    // pushing the picker in the same tick would be replaced away.
    const timer = setTimeout(async () => {
      if (cancelled || !isShareNavigationReady()) return;
      const share = await consumePendingShare();
      if (cancelled || !share) return;
      openShareTargetPicker(share);
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canOpen]);
}
