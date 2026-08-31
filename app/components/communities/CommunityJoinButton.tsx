import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CommunityJoinButtonProps {
  isMember?: boolean;
  isPending?: boolean;
  onJoin: () => void;
}

/**
 * Three-state join CTA on the community header: hidden for members, a
 * disabled "Requested" outline while pending, otherwise "Join Community".
 */
export default function CommunityJoinButton({ isMember, isPending, onJoin }: CommunityJoinButtonProps) {
  const { colors } = useTheme();

  if (isMember) return null;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: isPending ? colors.card : colors.primary,
          borderWidth: isPending ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
      onPress={isPending ? undefined : onJoin}
      disabled={isPending}
    >
      <Text style={[styles.text, { color: isPending ? colors.textSecondary : colors.onPrimary }]}>
        {isPending ? 'Requested' : 'Join Community'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
});
