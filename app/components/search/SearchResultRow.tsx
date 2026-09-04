import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import UserRow from '@/components/ui/UserRow';
import { User } from '@/types';

interface SearchResultRowProps {
  user: User;
  onPress: () => void;
}

/** One search hit: UserRow card with roles / industries / bio / location and an online dot. */
export default function SearchResultRow({ user, onPress }: SearchResultRowProps) {
  const { colors } = useTheme();
  const id = user.id || (user as any)._id;

  return (
    <UserRow
      variant="card"
      avatarSize={64}
      user={{
        id,
        name: user.name,
        avatar: user.avatar,
        isBadgeVerified: user.isBadgeVerified,
      }}
      style={styles.card}
      onPress={onPress}
      subtitle={
        <View>
          {/* Roles */}
          {user.roles && user.roles.length > 0 && (
            <Text style={[styles.rolesText, { color: colors.text }]} numberOfLines={1}>
              <Text style={styles.strong}>Roles: </Text>
              {user.roles.slice(0, 3).join(', ')}
            </Text>
          )}

          {/* Industries */}
          {user.industries && user.industries.length > 0 && (
            <Text style={[styles.industriesText, { color: colors.textSecondary }]} numberOfLines={1}>
              <Text style={styles.strong}>Industries: </Text>
              {user.industries.slice(0, 3).join(', ')}
            </Text>
          )}

          {/* Bio */}
          {user.bio && (
            <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={2}>
              {user.bio}
            </Text>
          )}

          {/* Location */}
          {user.location && <Text style={[styles.location, { color: colors.primary }]}>📍 {user.location}</Text>}
        </View>
      }
      trailing={user.isOnline ? <View style={[styles.onlineBadge, { backgroundColor: colors.success }]} /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
  },
  strong: {
    fontWeight: '600',
  },
  rolesText: {
    fontSize: 14,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  industriesText: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 18,
  },
  location: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  onlineBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
