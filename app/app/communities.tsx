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
import { Users } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Community } from '@/types';

const mockCommunities: Community[] = [
  {
    id: '1',
    name: 'Bollywood Directors',
    description: 'Connect with directors across Bollywood',
    coverImage:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    memberCount: 1234,
    industry: 'bollywood',
    isMember: true,
  },
  {
    id: '2',
    name: 'DOP Network',
    description: 'Cinematographers sharing techniques',
    coverImage:
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800',
    memberCount: 856,
    industry: 'tollywood',
    isMember: false,
  },
  {
    id: '3',
    name: 'Film Editors Hub',
    description: 'Post-production professionals unite',
    coverImage:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
    memberCount: 634,
    industry: 'kollywood',
    isMember: true,
  },
];

export default function CommunitiesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [communities] = useState<Community[]>(mockCommunities);

  const joinedCommunities = communities.filter((c) => c.isMember);
  const discoverCommunities = communities.filter((c) => !c.isMember);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Communities',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {joinedCommunities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Your Communities
            </Text>
            {joinedCommunities.map((community) => (
              <TouchableOpacity
                key={community.id}
                style={[
                  styles.communityCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    `/community?id=${community.id}&name=${community.name}`
                  )
                }
              >
                <Image
                  source={{ uri: community.coverImage }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
                <View style={styles.communityInfo}>
                  <Text style={[styles.communityName, { color: colors.text }]}>
                    {community.name}
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {community.description}
                  </Text>
                  <View style={styles.memberInfo}>
                    <Users size={16} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.memberCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {community.memberCount.toLocaleString()} members
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {discoverCommunities.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Discover
            </Text>
            {discoverCommunities.map((community) => (
              <TouchableOpacity
                key={community.id}
                style={[
                  styles.communityCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                activeOpacity={0.8}
                onPress={() =>
                  router.push(
                    `/community?id=${community.id}&name=${community.name}`
                  )
                }
              >
                <Image
                  source={{ uri: community.coverImage }}
                  style={styles.coverImage}
                  contentFit="cover"
                />
                <View style={styles.communityInfo}>
                  <Text style={[styles.communityName, { color: colors.text }]}>
                    {community.name}
                  </Text>
                  <Text
                    style={[
                      styles.description,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={2}
                  >
                    {community.description}
                  </Text>
                  <View style={styles.memberInfo}>
                    <Users size={16} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.memberCount,
                        { color: colors.textSecondary },
                      ]}
                    >
                      {community.memberCount.toLocaleString()} members
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  communityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
  },
  coverImage: {
    width: '100%',
    height: 120,
  },
  communityInfo: {
    padding: 16,
  },
  communityName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberCount: {
    fontSize: 13,
  },
});
