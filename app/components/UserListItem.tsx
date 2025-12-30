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

  const navigateToProfile = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: '/user/[id]',
        params: { id: user._id || user.id }
      });
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <TouchableOpacity
        onPress={navigateToProfile}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
      >
        <Image
          source={{ uri: user.avatar }}
          style={styles.avatar}
          contentFit="cover"
        />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={navigateToProfile}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
          >
            <Text style={[styles.name, { color: colors.text }]}>{user.name}</Text>
          </TouchableOpacity>
          {user.isVerified && (
            <BadgeCheck size={16} color="#FFFFFF" fill={colors.primary} style={styles.badge} />
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
    </View>
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
