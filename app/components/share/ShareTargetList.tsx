import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SearchBar from '@/components/ui/SearchBar';
import UserRow from '@/components/ui/UserRow';
import EmptyState from '@/components/ui/EmptyState';
import { MessageSkeleton } from '@/components/skeletons/MessageSkeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { ShareTarget } from '@/hooks/useShareTargets';

interface ShareTargetListProps {
  query: string;
  onQueryChange: (query: string) => void;
  /** Existing conversations. */
  chats: ShareTarget[];
  /** Search results, minus anyone already in `chats`. */
  people: ShareTarget[];
  groups: ShareTarget[];
  loadingChats: boolean;
  searchingPeople: boolean;
  /** Nothing to show in any section, and nothing still loading. */
  isEmpty: boolean;
  onSelect: (target: ShareTarget) => void;
}

/**
 * Everywhere a share can be sent, in one searchable list: conversations first
 * (the likeliest target by far), then people found by name, then the groups of
 * the communities the user belongs to.
 *
 * Rows are the same UserRow the Messages screen and the people search use, so a
 * conversation looks here exactly as it does there.
 */
export default function ShareTargetList({
  query,
  onQueryChange,
  chats,
  people,
  groups,
  loadingChats,
  searchingPeople,
  isEmpty,
  onSelect,
}: ShareTargetListProps) {
  const { colors } = useTheme();

  const rows = (targets: ShareTarget[]) =>
    targets.map((target) => (
      <UserRow
        key={target.key}
        variant="card"
        avatarSize={48}
        user={{
          id: target.id,
          name: target.name,
          avatar: target.avatar,
          isBadgeVerified: target.isBadgeVerified,
        }}
        subtitle={target.subtitle}
        onPress={() => onSelect(target)}
      />
    ));

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <SearchBar
          value={query}
          onChangeText={onQueryChange}
          onClear={() => onQueryChange('')}
          placeholder="Search people and groups..."
        />
      </View>

      {loadingChats ? (
        <View>
          {[1, 2, 3, 4].map((i) => (
            <MessageSkeleton key={i} />
          ))}
        </View>
      ) : (
        <>
          {chats.length > 0 && <Section title="Recent chats">{rows(chats)}</Section>}

          {(people.length > 0 || searchingPeople) && (
            <Section title="People">
              {searchingPeople && people.length === 0 ? (
                <ActivityIndicator color={colors.primary} style={styles.spinner} />
              ) : (
                rows(people)
              )}
            </Section>
          )}

          {groups.length > 0 && <Section title="Groups">{rows(groups)}</Section>}

          {isEmpty && (
            <EmptyState
              icon={Users}
              title={query ? 'No matches' : 'Nobody to share with yet'}
              subtitle={
                query
                  ? 'No people or groups match that search.'
                  : 'Follow people or join a community, then you can share into a chat or a group.'
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  search: { paddingBottom: 16 },
  spinner: { paddingVertical: 16 },
});
