import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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
  BadgeCheck,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { ContentType } from '@/types';

interface UserPost {
  _id: string;
  type: ContentType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption?: string;
}

interface UserStats {
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, token } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState<ContentType | 'all'>('all');
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [stats, setStats] = useState<UserStats>({ followersCount: 0, followingCount: 0, postsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && token) {
      loadUserData();
    }
  }, [user, token]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get user ID - try multiple sources
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userId = (user as any)?._id || (user as any)?.id || user?.id;
      
      if (!userId) {
        console.error('[Profile] No user ID found');
        setLoading(false);
        return;
      }

      console.log('[Profile] Loading data for user:', userId);
      
      // Fetch user data and posts
      const [userData, postsData] = await Promise.all([
        api.user(userId, token).catch(err => {
          console.error('[Profile] Error fetching user:', err);
          return null;
        }),
        api.getUserFeed(userId, 0, 100, token).catch(err => {
          console.error('[Profile] Error fetching posts:', err);
          return { data: [] };
        }),
      ]);
      
      console.log('[Profile] User data:', userData);
      console.log('[Profile] Posts data:', postsData);
      
      // Update stats if available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userInfo = userData as any;
      if (userInfo?.stats) {
        console.log('[Profile] Setting stats:', userInfo.stats);
        setStats(userInfo.stats);
      } else {
        console.log('[Profile] No stats in user data, using defaults');
      }
      
      // Update posts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const postsArray = (postsData as any)?.data || [];
      console.log('[Profile] Setting posts:', postsArray.length);
      setPosts(postsArray);
      
      // If no stats from API, use post count
      if (!userInfo?.stats) {
        setStats(prev => ({
          ...prev,
          postsCount: postsArray.length,
        }));
      }
    } catch (error) {
      console.error('[Profile] Error loading:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedFilter === 'all'
    ? posts
    : posts.filter((post) => post.type === selectedFilter);

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
            <TouchableOpacity 
              onPress={() => router.push('/edit-profile')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
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
          <View style={styles.nameContainer}>
            <Text style={[styles.name, { color: colors.text }]}>
              {user.name || 'Your Name'}
            </Text>
            {user.isVerified && (
              <BadgeCheck size={24} color={colors.primary} fill="transparent" />
            )}
          </View>
          <View style={styles.rolesContainer}>
            {user.roles?.map((role, idx) => (
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
            {user.experience && user.experience > 0 && (
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
                {loading ? '-' : stats.postsCount || posts.length}
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
                {loading ? '-' : stats.followersCount || 0}
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
                {loading ? '-' : stats.followingCount || 0}
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

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.portfolio}>
            {filteredPosts.map((post) => (
              <TouchableOpacity
                key={post._id}
                style={styles.portfolioItem}
                onPress={() => router.push(`/post/${post._id}`)}
              >
                <Image
                  source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                  style={styles.portfolioImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
            {filteredPosts.length === 0 && (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No {selectedFilter === 'all' ? 'posts' : selectedFilter} yet
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
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
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontWeight: '600',
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
    width: '100%',
  },
});
