import React from 'react';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityGroup } from '@/types';
import CommunityGroupCard from '@/components/communities/CommunityGroupCard';
import EmptyState from '@/components/ui/EmptyState';

interface GroupListProps {
  groups: CommunityGroup[];
  /** Rendered above the first group (the community header). */
  header?: React.ReactElement | null;
  refreshing: boolean;
  onRefresh: () => void;
  onOpen: (groupId: string) => void;
  onJoin: (groupId: string) => void;
  showJoin: (group: CommunityGroup) => boolean;
}

/** Pull-to-refresh list of a community's groups with an empty state. */
export default function GroupList({
  groups,
  header,
  refreshing,
  onRefresh,
  onOpen,
  onJoin,
  showJoin,
}: GroupListProps) {
  const { colors } = useTheme();

  return (
    <FlatList
      data={groups}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <CommunityGroupCard
          group={item}
          onPress={() => onOpen(item._id)}
          onJoin={() => onJoin(item._id)}
          showJoin={showJoin(item)}
        />
      )}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <EmptyState title="No Groups Yet" subtitle="Groups will appear here once created." />
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 100,
  },
});
