import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface FollowRequestActionsProps {
  /** Disables both buttons and swaps their labels for spinners. */
  loading: boolean;
  onAccept: () => void;
  onReject: () => void;
}

/** Accept / Reject row shown under a follow_request notification. */
export default function FollowRequestActions({ loading, onAccept, onReject }: FollowRequestActionsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.actionButtons}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onAccept}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.acceptText}>Accept</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.rejectButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={onReject}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : (
          <>
            <X size={16} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Reject</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  rejectButton: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  acceptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
