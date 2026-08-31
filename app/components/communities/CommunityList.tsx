import React from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { Community } from '@/types';
import CommunityCard from '@/components/communities/CommunityCard';
import EmptyState from '@/components/ui/EmptyState';
import { CommunitySkeleton } from '@/components/skeletons/CommunitySkeleton';

interface CommunityListProps {
  communities: Community[];
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  joiningId: string | null;
  onJoin: (id: string) => void;
  /** When given, the empty state offers a "Discover Communities" button. */
  onDiscover?: () => void;
}

/**
 * The communities feed: skeletons while loading, otherwise a pull-to-refresh
 * list of CommunityCards with an empty state. Tapping a card opens it.
 */
export default function CommunityList({
  communities,
  loading,
  refreshing,
  onRefresh,
  joiningId,
  onJoin,
  onDiscover,
}: CommunityListProps) {
  const router = useRouter();
  const { colors } = useTheme();

  if (loading && !refreshing) {
    return (
      <View style={styles.skeletons}>
        {[1, 2, 3].map((i) => (
          <CommunitySkeleton key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={communities}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <CommunityCard
          community={item}
          onPress={() => router.push(`/communities/${item._id}`)}
          onJoin={!item.isMember ? () => onJoin(item._id) : undefined}
          joining={joiningId === item._id}
        />
      )}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      ListEmptyComponent={
        <EmptyState
          title="Connect with others, join discussions, and stay updated."
          action={
            onDiscover ? (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }]}
                onPress={onDiscover}
              >
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  Discover Communities
                </Text>
              </TouchableOpacity>
            ) : undefined
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  skeletons: {
    padding: 16,
  },
  list: {
    padding: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  buttonText: {
    fontWeight: '700',
  },
});
