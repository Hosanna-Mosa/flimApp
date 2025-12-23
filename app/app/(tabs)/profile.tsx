import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  MapPin,
  Briefcase,
  Edit,
  Grid3x3,
  Video,
  Music,
  FileText,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { mockPosts } from '@/mocks/posts';
import { ContentType } from '@/types';

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<ContentType | 'all'>(
    'all'
  );

  const userPosts = mockPosts.filter((post) => post.userId === user?.id);

  const filteredPosts =
    selectedFilter === 'all'
      ? userPosts
      : userPosts.filter((post) => post.type === selectedFilter);

  const filters = [
    { id: 'all' as const, label: 'All', icon: Grid3x3 },
    { id: 'video' as ContentType, label: 'Videos', icon: Video },
    { id: 'audio' as ContentType, label: 'Audio', icon: Music },
    { id: 'image' as ContentType, label: 'Images', icon: ImageIcon },
    { id: 'script' as ContentType, label: 'Scripts', icon: FileText },
  ];

  if (!user) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Profile',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/edit-profile')}>
              <Edit size={20} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={{ uri: user.avatar }}
            style={styles.avatar}
            contentFit="cover"
          />
          <Text style={[styles.name, { color: colors.text }]}>
            {user.name || 'Your Name'}
          </Text>
          <View style={styles.rolesContainer}>
            {user.roles.map((role, idx) => (
              <View
                key={idx}
                style={[styles.roleBadge, { backgroundColor: colors.surface }]}
              >
                <Text style={[styles.roleText, { color: colors.text }]}>
                  {role}
                </Text>
              </View>
            ))}
          </View>
          <Text style={[styles.bio, { color: colors.textSecondary }]}>
            {user.bio || 'Add a bio to tell others about yourself'}
          </Text>

          <View style={styles.info}>
            {user.location && (
              <View style={styles.infoRow}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {user.location}
                </Text>
              </View>
            )}
            {user.experience > 0 && (
              <View style={styles.infoRow}>
                <Briefcase size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.infoText, { color: colors.textSecondary }]}
                >
                  {user.experience} years experience
                </Text>
              </View>
            )}
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {userPosts.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Posts
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                1.2K
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Followers
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                340
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Following
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.filters, { borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filter,
                    selectedFilter === filter.id && {
                      borderBottomColor: colors.primary,
                      borderBottomWidth: 2,
                    },
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Icon
                    size={20}
                    color={
                      selectedFilter === filter.id
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.filterText,
                      {
                        color:
                          selectedFilter === filter.id
                            ? colors.primary
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.portfolio}>
          {filteredPosts.map((post) => (
            <View key={post.id} style={styles.portfolioItem}>
              <Image
                source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                style={styles.portfolioImage}
                contentFit="cover"
              />
            </View>
          ))}
          {filteredPosts.length === 0 && (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No {selectedFilter === 'all' ? 'posts' : selectedFilter} yet
            </Text>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  rolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    justifyContent: 'center',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  info: {
    gap: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
  },
  stats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  filters: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  portfolio: {
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  portfolioItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 2,
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  emptyText: {
    textAlign: 'center',
    padding: 40,
    fontSize: 14,
  },
});
