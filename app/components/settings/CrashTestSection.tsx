import React from 'react';
import { Alert } from 'react-native';
import { Bug, AlertTriangle } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';
import { reportError } from '@/utils/analytics';

/**
 * TEMPORARY — remove once Crashlytics is confirmed working.
 *
 * Crashlytics shows nothing at all until it receives its first report, so the
 * console cannot distinguish "not installed" from "installed, nothing has
 * crashed". The only way to tell them apart is to crash on purpose.
 *
 * Two rows because they prove different halves:
 *
 *   Handled error — goes through reportError, which is what the app calls when
 *     it catches something. Appears under Crashlytics "non-fatals". Safe: the
 *     app keeps running.
 *   Real crash — throws from a native module so the process actually dies. This
 *     is what a genuine crash looks like.
 *
 * Reports upload on the NEXT launch, not at the moment of the crash — the app
 * is dying and cannot reliably make a network call — so reopen the app after
 * using either row.
 */
export default function CrashTestSection() {
  const sendHandledError = () => {
    reportError(new Error('Test non-fatal from settings'), 'CrashTestSection');
    Alert.alert(
      'Handled error sent',
      'Reopen the app, then check Crashlytics. It appears under non-fatals within a few minutes.'
    );
  };

  const forceCrash = () => {
    Alert.alert(
      'Crash the app?',
      'The app will close immediately. Reopen it afterwards so the report can upload.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Crash it',
          style: 'destructive',
          onPress: () => {
            try {
              // crash() is the native trigger; it kills the process rather than
              // throwing something JavaScript could catch and swallow.
              const crashlytics = require('@react-native-firebase/crashlytics').default();
              crashlytics.crash();
            } catch {
              // No native module — Expo Go or a build without Firebase. Throwing
              // async escapes the error boundary so the app still goes down.
              setTimeout(() => {
                throw new Error('Forced test crash (no native Crashlytics available)');
              }, 0);
            }
          },
        },
      ]
    );
  };

  return (
    <Section title="Crash testing (temporary)">
      <SettingsRow icon={Bug} label="Send a handled error" onPress={sendHandledError} />
      <SettingsRow icon={AlertTriangle} label="Force a real crash" onPress={forceCrash} />
    </Section>
  );
}
