import React from 'react';
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { JoinRequester } from '@/hooks/useJoinRequests';
import UserRow from '@/components/ui/UserRow';
import EmptyState from '@/components/ui/EmptyState';

interface JoinRequestListProps {
  requests: JoinRequester[];
  refreshing: boolean;
  onRefresh: () => void;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
}

/** Pending requesters as UserRows with reject (✕) and approve (✓) buttons. */
export default function JoinRequestList({
  requests,
  refreshing,
  onRefresh,
  onApprove,
  onReject,
}: JoinRequestListProps) {
  const { colors } = useTheme();

  return (
    <FlatList
      data={requests}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <UserRow
          variant="list"
          avatarSize={48}
          user={{
            id: item._id,
            name: item.name,
            avatar: item.avatar,
            isBadgeVerified: item.isBadgeVerified,
          }}
          subtitle={item.bio || undefined}
          style={styles.item}
          trailing={
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${colors.error}20` }]}
                onPress={() => onReject(item._id)}
                accessibilityRole="button"
                accessibilityLabel={`Reject ${item.name}`}
              >
                <X size={20} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: `${colors.success}20` }]}
                onPress={() => onApprove(item._id)}
                accessibilityRole="button"
                accessibilityLabel={`Approve ${item.name}`}
              >
                <Check size={20} color={colors.success} />
              </TouchableOpacity>
            </View>
          }
        />
      )}
      ListEmptyComponent={<EmptyState title="No pending requests" variant="fullscreen" />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  item: {
    paddingHorizontal: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
