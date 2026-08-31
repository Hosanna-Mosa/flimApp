import React from 'react';
import { StyleSheet } from 'react-native';
import Screen from '@/components/layout/Screen';

interface AuthScreenProps {
  /** Vertically centre the content (Reset Password). */
  centered?: boolean;
  /** Wrap in KeyboardAvoidingView (default true; landing turns it off). */
  keyboard?: boolean;
  /** Scrollable body (default true). */
  scroll?: boolean;
  /** Extra space under the content so a sticky footer never covers it. */
  bottomPadding?: number;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Page scaffold for the auth + onboarding flow: no native header, all four
 * safe-area edges, 24px padding and keyboard avoidance. The theme background
 * comes from Screen.
 */
export default function AuthScreen({
  centered,
  keyboard = true,
  scroll = true,
  bottomPadding,
  footer,
  children,
}: AuthScreenProps) {
  return (
    <Screen
      headerShown={false}
      keyboard={keyboard}
      scroll={scroll}
      padded={false}
      edges={['top', 'bottom', 'left', 'right']}
      contentStyle={[
        styles.content,
        centered && styles.centered,
        bottomPadding !== undefined && { paddingBottom: bottomPadding },
      ]}
      footer={footer}
    >
      {children}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
  },
  centered: {
    justifyContent: 'center',
  },
});
