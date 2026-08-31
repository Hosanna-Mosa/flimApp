import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';

interface ScreenProps {
  /** Native header title. Omit (and leave headerShown unset) for no header. */
  title?: string;
  /** Custom header title element (overrides `title` text). */
  headerTitle?: () => React.ReactNode;
  headerShown?: boolean;
  headerTitleAlign?: 'left' | 'center';
  headerBackTitle?: string;
  headerRight?: () => React.ReactNode;
  headerLeft?: () => React.ReactNode;
  /** Wrap content in a ScrollView (default true). Use false for FlatList screens. */
  scroll?: boolean;
  /** Wrap in KeyboardAvoidingView for screens with text inputs. */
  keyboard?: boolean;
  /** Passed to KeyboardAvoidingView (e.g. native header height on iOS). */
  keyboardOffset?: number;
  /** Horizontal + vertical content padding (default true when scroll is on). */
  padded?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Safe-area edges to respect. Default: bottom only (the header handles top). */
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Rendered outside the scroll area, pinned to the bottom (e.g. sticky CTA). */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Page scaffold used by every screen: themed background, native header config,
 * safe area, optional scroll / keyboard avoidance / pull-to-refresh.
 * Change page chrome here and it changes everywhere.
 */
export default function Screen({
  title,
  headerTitle,
  headerShown,
  headerTitleAlign,
  headerBackTitle,
  headerRight,
  headerLeft,
  scroll = true,
  keyboard = false,
  keyboardOffset,
  padded,
  refreshing = false,
  onRefresh,
  edges = ['bottom', 'left', 'right'],
  contentStyle,
  footer,
  children,
}: ScreenProps) {
  const { colors } = useTheme();
  const showHeader = headerShown ?? (title !== undefined || !!headerTitle);
  const isPadded = padded ?? scroll;

  let body: React.ReactNode = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[isPadded && styles.padded, contentStyle]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, isPadded && styles.padded, contentStyle]}>{children}</View>
  );

  if (keyboard) {
    body = (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
      >
        {body}
      </KeyboardAvoidingView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={edges}>
      <Stack.Screen
        options={{
          headerShown: showHeader,
          // Header chrome is owned here so every page is themed identically,
          // regardless of which navigator (root Stack or Tabs) renders it.
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { color: colors.text },
          headerShadowVisible: false,
          ...(headerTitle ? { headerTitle } : title !== undefined ? { headerTitle: title } : {}),
          ...(headerTitleAlign ? { headerTitleAlign } : {}),
          ...(headerBackTitle ? { headerBackTitle } : {}),
          ...(headerRight ? { headerRight } : {}),
          ...(headerLeft ? { headerLeft } : {}),
        }}
      />
      {body}
      {footer}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  padded: { padding: 20 },
});
