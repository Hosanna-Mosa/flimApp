import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type ProfileNoticeVariant = 'private' | 'blocked' | 'privatePosts';

const NOTICES: Record<
  ProfileNoticeVariant,
  { message: string; container: StyleProp<ViewStyle>; text?: StyleProp<TextStyle> }
> = {
  private: {
    message: 'This account is private. Follow to see their posts and updates.',
    container: { paddingHorizontal: 40, paddingVertical: 20, marginBottom: 20 },
    text: { lineHeight: 20 },
  },
  blocked: {
    message: 'You blocked this user. Interactions are disabled until you unblock from options.',
    container: { paddingHorizontal: 40, paddingVertical: 12 },
    text: { lineHeight: 18 },
  },
  privatePosts: {
    message: 'Posts are hidden for private accounts',
    container: { padding: 40 },
  },
};

interface ProfileNoticeProps {
  variant: ProfileNoticeVariant;
}

/** Centered explanatory copy on a public profile (private account, blocked user, hidden posts). */
export default function ProfileNotice({ variant }: ProfileNoticeProps) {
  const { colors } = useTheme();
  const notice = NOTICES[variant];

  return (
    <View style={[styles.container, notice.container]}>
      <Text style={[styles.text, { color: colors.textSecondary }, notice.text]}>{notice.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  text: {
    fontSize: 14,
    textAlign: 'center',
  },
});
