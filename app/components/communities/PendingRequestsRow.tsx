import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ChevronRight, UserCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SettingsRow from '@/components/ui/SettingsRow';

interface PendingRequestsRowProps {
  /** Pending join requests; shown as a badge when > 0. */
  count: number;
  onPress: () => void;
}

/** "Join Requests" settings row with an error-tinted pending-count badge. */
export default function PendingRequestsRow({ count, onPress }: PendingRequestsRowProps) {
  const { colors } = useTheme();

  return (
    <SettingsRow
      icon={UserCheck}
      label="Join Requests"
      onPress={onPress}
      trailing={
        count > 0 ? (
          <View style={styles.trailing}>
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </View>
        ) : (
          'chevron'
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
