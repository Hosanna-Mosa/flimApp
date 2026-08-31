import React from 'react';
import { ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import EmptyState from '@/components/ui/EmptyState';
import SearchResultRow from '@/components/search/SearchResultRow';
import { User } from '@/types';

interface SearchResultListProps {
  results: User[];
  isSearching: boolean;
  /** Whether a query or any filter is set — picks the empty-state copy. */
  hasCriteria: boolean;
  onPressUser: (id: string) => void;
}

/** Scrollable results: spinner while searching, user cards, or the appropriate empty state. */
export default function SearchResultList({ results, isSearching, hasCriteria, onPressUser }: SearchResultListProps) {
  const { colors } = useTheme();
  return (
    <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
      {isSearching ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
      ) : results.length > 0 ? (
        results.map((user) => {
          const id = user.id || (user as any)._id;
          return <SearchResultRow key={id} user={user} onPress={() => onPressUser(id)} />;
        })
      ) : hasCriteria ? (
        <EmptyState title="No results found" />
      ) : (
        <EmptyState title="Start typing to search..." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  results: {
    flex: 1,
  },
  spinner: {
    marginTop: 40,
  },
});
