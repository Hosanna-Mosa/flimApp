import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePathname } from 'expo-router';
import { flushAnalytics, track, trackScreen } from '@/utils/analytics';

/**
 * Records a screen view whenever the route changes, and reports app opens.
 *
 * Reading the router rather than instrumenting each screen means a screen added
 * later is covered without anyone remembering to add a call, and there is no
 * per-screen boilerplate to drift out of date.
 */
export function useScreenTracking() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;

    // Route params carry ids — /user/6952a9aa… — which would make every profile
    // its own screen name and bury the pattern. Ids become :id so the report
    // says how often profiles are opened, not which ones.
    const name = pathname
      .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, '/:id')
      .replace(/\/\d+(?=\/|$)/g, '/:n');

    trackScreen(name || '/');
  }, [pathname]);

  useEffect(() => {
    track('app_opened');

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        track('app_opened');
      } else if (state === 'background') {
        // Send whatever is queued before the OS suspends the process, or the
        // batch waits until the next launch and can be lost entirely.
        flushAnalytics();
      }
    });

    return () => sub.remove();
  }, []);
}
