import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { User } from '@/types';
import { useRouter } from 'expo-router';

interface UserListItemProps {
  user: User;
  onPress?: () => void;
}

export default function UserListItem({ user, onPress }: UserListItemProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/user/${user._id || user.id}`);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
    >
      <Image
        source={{ uri: user.avatar }}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          {user.isVerified && (
            <BadgeCheck size={16} color={colors.primary} fill="transparent" style={styles.badge} />
          )}
        </View>
        
        {user.roles && user.roles.length > 0 && (
          <Text style={[styles.roles, { color: colors.textSecondary }]} numberOfLines={1}>
            {user.roles.join(' • ')}
          </Text>
        )}
        
        {user.bio && (
          <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>
            {user.bio}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  badge: {
    marginLeft: 4,
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
