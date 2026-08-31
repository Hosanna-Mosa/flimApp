import React from 'react';
import { View, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface ChatScreenShellProps {
  /** Usually a <ChatHeader />; rendered above the body, outside keyboard avoidance. */
  header: React.ReactNode;
  /**
   * iOS-only KeyboardAvoidingView (padding) offset by the header height.
   * Leave off when the composer lifts itself (ChatInputBar does on Android).
   */
  keyboardAvoiding?: boolean;
  children: React.ReactNode;
}

const HEADER_HEIGHT = 54;

/**
 * Page scaffold for the chat screens: hides the native header, paints the
 * themed background, and stacks the custom header over a flex body.
 */
export default function ChatScreenShell({ header, keyboardAvoiding = false, children }: ChatScreenShellProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {header}
      {keyboardAvoiding ? (
        <KeyboardAvoidingView
          style={[styles.flex, { backgroundColor: colors.background }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT + insets.top : 0}
        >
          {children}
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.flex, { backgroundColor: colors.background }]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
