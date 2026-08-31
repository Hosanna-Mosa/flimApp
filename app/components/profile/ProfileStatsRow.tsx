import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { UserStats } from '@/types';

interface ProfileStatsRowProps {
  stats?: Partial<UserStats> | null;
  /** Whose network the followers / following taps open. */
  userId: string;
  /** false renders followers / following as plain, non-pressable counters (private accounts). */
  interactive?: boolean;
}

/** Posts / Followers / Following counters under a profile header. */
export default function ProfileStatsRow({ stats, userId, interactive = true }: ProfileStatsRowProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const openNetwork = (type: 'followers' | 'following') =>
    router.push({ pathname: '/user/network', params: { userId, type } });

  const renderStat = (value: number, label: string, type?: 'followers' | 'following') => {
    const body = (
      <>
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      </>
    );
    if (type && interactive) {
      return (
        <TouchableOpacity style={styles.stat} onPress={() => openNetwork(type)} activeOpacity={0.7}>
          {body}
        </TouchableOpacity>
      );
    }
    return (
      <View style={styles.stat} pointerEvents="none">
        {body}
      </View>
    );
  };

  return (
    <View style={styles.stats}>
      {renderStat(stats?.postsCount ?? 0, 'Posts')}
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      {renderStat(stats?.followersCount ?? 0, 'Followers', 'followers')}
      <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
      {renderStat(stats?.followingCount ?? 0, 'Following', 'following')}
    </View>
  );
}

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
});
