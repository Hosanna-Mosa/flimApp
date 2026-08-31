import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { consumePendingNotificationRoute } from '@/utils/notificationRouting';

/**
 * Splash-screen redirect: once auth has resolved, waits 2s (so the logo
 * animation plays) then routes to sign-in, onboarding, or home. When landing
 * on home, opens any notification route that was tapped while the app was
 * closed on top of it.
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
          // A push tapped while the app was closed: open its screen on top of home.
          const pending = consumePendingNotificationRoute();
          if (pending) {
            setTimeout(() => router.push(pending as any), 400);
          }
        }
      }, 2000);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, router]);
}
