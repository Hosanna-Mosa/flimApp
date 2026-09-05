import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import UserRow from '@/components/ui/UserRow';
import EmptyState from '@/components/ui/EmptyState';
import ListFooterLoader from '@/components/ui/ListFooterLoader';
import { User } from '@/types';

interface NetworkUserListProps {
  users: User[];
  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  loadingMore: boolean;
  emptyTitle: string;
}

/** Roles line + bio line under the name (only rendered when either exists). */
function NetworkUserSubtitle({ user }: { user: User }) {
  const { colors } = useTheme();
  const hasRoles = !!user.roles && user.roles.length > 0;

  return (
    <View>
      {hasRoles && (
        <Text style={[styles.roles, { color: colors.textSecondary }]} numberOfLines={1}>
          {user.roles.join(' • ')}
        </Text>
      )}
      {!!user.bio && (
        <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>
          {user.bio}
        </Text>
      )}
    </View>
  );
}

/** Paginated FlatList of followers / following with refresh, footer loader and empty state. */
export default function NetworkUserList({
  users,
  refreshing,
  onRefresh,
  onEndReached,
  loadingMore,
  emptyTitle,
}: NetworkUserListProps) {
  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item._id || item.id}
      renderItem={({ item }) => (
        <UserRow
          user={{
            id: item._id || item.id,
            name: item.name,
            avatar: item.avatar,
            isBadgeVerified: item.isBadgeVerified,
          }}
          avatarSize={50}
          subtitle={
            (item.roles && item.roles.length > 0) || item.bio ? <NetworkUserSubtitle user={item} /> : undefined
          }
        />
      )}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListEmptyComponent={<EmptyState title={emptyTitle} />}
      ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
      contentContainerStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
  roles: {
    fontSize: 12,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 12,
  },
});
