import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface BlockedConversationBannerProps {
  /** True when the viewer did the blocking (shows the Unblock button). */
  isBlockedByMe: boolean;
  onUnblock: () => void;
}

/** Shown above the composer when either side has blocked the other. */
export default function BlockedConversationBanner({ isBlockedByMe, onUnblock }: BlockedConversationBannerProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.banner, { backgroundColor: colors.background }]}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>
        {isBlockedByMe
          ? 'You blocked this user. Unblock to continue chatting.'
          : 'Chat is unavailable because of a block.'}
      </Text>
      {isBlockedByMe && (
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={onUnblock}>
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>Unblock</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 14,
  },
});
