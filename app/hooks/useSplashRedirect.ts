import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { consumePendingShare, markShareNavigationReady } from '@/utils/shareIntent';
import { openShareTargetPicker } from '@/hooks/useIncomingShare';

/**
 * Splash-screen redirect: once auth has resolved, waits 2s (so the logo
 * animation plays) then routes to sign-in, onboarding, or home. When landing
 * on home, opens any content that arrived from the OS share sheet while the
 * app was closed. (A parked notification or link route is opened by the home
 * screen itself — see usePendingRoute.)
 */
export function useSplashRedirect() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (!isAuthenticated) {
          router.replace('/auth');
        } else if (!hasCompletedOnboarding) {
          router.replace('/auth/onboarding');
        } else {
          router.replace('/home');
          // The route parked for a tapped notification or a shared link is
          // opened by the home screen itself (usePendingRoute), which also
          // covers arriving at home from sign-in rather than from here.

          // Content shared into the app while it was closed. Opened after the
          // parked route so the picker ends up on top: the share is what the
          // user was doing just now.
          setTimeout(() => {
            consumePendingShare()
              .then((share) => {
                if (share) openShareTargetPicker(share);
              })
              .catch((err) => console.error('[share] Could not open the parked share:', err));
          }, 400);
        }

        // Anything pushed before this point is replaced away, so the share
        // flow waits for it.
        markShareNavigationReady();
      }, 2000);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, router]);
}
