import React from 'react';
import { Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityMember } from '@/types';
import UserRow from '@/components/ui/UserRow';
import EmptyState from '@/components/ui/EmptyState';
import ListFooterLoader from '@/components/ui/ListFooterLoader';

interface MemberListProps {
  members: CommunityMember[];
  /** Viewer is admin/owner: shows the ⋮ menu on non-owner rows. */
  canManage: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
  onMemberAction: (member: CommunityMember) => void;
}

/** Paginated member rows: avatar, name (+ role suffix), bio and a ⋮ menu. */
export default function MemberList({
  members,
  canManage,
  loadingMore,
  onLoadMore,
  onMemberAction,
}: MemberListProps) {
  const { colors } = useTheme();

  const roleSuffix = (role: CommunityMember['role']) =>
    role === 'owner' ? (
      <Text style={[styles.role, { color: colors.primary }]}> (Owner)</Text>
    ) : role === 'admin' ? (
      <Text style={[styles.role, { color: colors.primary }]}> (Admin)</Text>
    ) : null;

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <UserRow
          variant="list"
          avatarSize={48}
          user={{
            id: item.user._id as string,
            name: item.user.name,
            avatar: item.user.avatar,
            isBadgeVerified: item.user.isBadgeVerified,
          }}
          nameSuffix={roleSuffix(item.role)}
          subtitle={item.user.bio || 'No bio'}
          trailing={
            canManage && item.role !== 'owner' ? (
              <TouchableOpacity
                onPress={() => onMemberAction(item)}
                accessibilityRole="button"
                accessibilityLabel={`Manage ${item.user.name}`}
              >
                <MoreVertical color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      )}
      ListEmptyComponent={<EmptyState title="No members found." variant="fullscreen" />}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={<ListFooterLoader visible={loadingMore} />}
    />
  );
}

const styles = StyleSheet.create({
  role: {
    fontSize: 12,
  },
});
