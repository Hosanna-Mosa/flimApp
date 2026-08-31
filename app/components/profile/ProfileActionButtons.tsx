import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Clock, Plus, MessageCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileActionButtonsProps {
  isFollowing: boolean;
  /** A follow request to a private account is awaiting approval. */
  isPending: boolean;
  /** Private accounts show "Request" instead of "Follow" and hide Message until followed. */
  isPrivateAccount: boolean;
  /** Blocked user: both buttons stay visible but inert. */
  disabled?: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
}

/** Follow / Request / Requested / Following + Message row on a public profile. */
export default function ProfileActionButtons({
  isFollowing,
  isPending,
  isPrivateAccount,
  disabled = false,
  onToggleFollow,
  onMessage,
}: ProfileActionButtonsProps) {
  const { colors } = useTheme();
  const muted = isFollowing || isPending;
  const showMessage = !isPrivateAccount || isFollowing;
  const followLabel = isFollowing ? 'Following' : isPending ? 'Requested' : isPrivateAccount ? 'Request' : 'Follow';
  const FollowIcon = isFollowing ? Check : isPending ? Clock : Plus;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.button,
          muted
            ? { backgroundColor: colors.surface, borderColor: colors.border }
            : { backgroundColor: colors.link, borderColor: colors.link },
          // Full width when the message button is hidden
          showMessage ? styles.flex : styles.full,
        ]}
        onPress={onToggleFollow}
        disabled={disabled}
      >
        <FollowIcon size={20} color={muted ? colors.text : '#fff'} />
        <Text style={[styles.label, { color: muted ? colors.text : '#fff' }]}>{followLabel}</Text>
      </TouchableOpacity>

      {showMessage && (
        <TouchableOpacity
          style={[
            styles.button,
            styles.flex,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: disabled ? 0.5 : 1 },
          ]}
          onPress={onMessage}
          disabled={disabled}
        >
          <MessageCircle size={20} color={colors.text} />
          <Text style={[styles.label, { color: colors.text }]}>Message</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  flex: {
    flex: 1,
  },
  full: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
