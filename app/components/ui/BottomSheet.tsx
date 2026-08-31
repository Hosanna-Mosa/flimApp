import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Rendered below the scrollable content, always visible (e.g. Done button). */
  footer?: React.ReactNode;
  /** Wrap children in a ScrollView (default true). */
  scroll?: boolean;
  children: React.ReactNode;
}

/**
 * Slide-up sheet with dim backdrop, drag handle, and title. Tapping the
 * backdrop or the hardware back button calls onClose.
 *
 * Keyboard: on iOS the sheet is lifted with KeyboardAvoidingView. On Android
 * (edge-to-edge, so the window no longer resizes) the sheet is moved up by the
 * reported keyboard height via useKeyboardHeight — a KAV inside an Android
 * Modal misreports its frame and leaves a gap under the sheet.
 */
export default function BottomSheet({
  visible,
  onClose,
  title,
  footer,
  scroll = true,
  children,
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  // Android: lift the sheet above the keyboard (iOS uses KAV below).
  const keyboardHeight = useKeyboardHeight();

  const sheet = (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.card,
          paddingBottom: (keyboardHeight > 0 ? 16 : Math.max(insets.bottom, 16)) + 8,
          maxHeight: Math.round((windowHeight - keyboardHeight) * 0.85),
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        {!!title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}
      </View>
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {footer}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      // Draw under the Android system bars (edge-to-edge) so the dim backdrop
      // and the sheet reach the physical screen edges.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>
        {Platform.OS === 'ios' ? (
          <KeyboardAvoidingView behavior="padding" style={styles.bottom} pointerEvents="box-none">
            {sheet}
          </KeyboardAvoidingView>
        ) : (
          <View style={[styles.bottom, { bottom: keyboardHeight }]} pointerEvents="box-none">
            {sheet}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 12,
  },
});
