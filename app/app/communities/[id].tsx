import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { Community } from '@/types';
import CommunityGroupCard from '@/components/communities/CommunityGroupCard';
import { MoreHorizontal, Plus, ShieldCheck } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;

      // Fetch Community Details
      const res = await api.community(id, token || undefined) as any;
      setCommunity(res);

      if (token) {
        try {
          const groupsRes = await api.communityGroups(id, token) as any;
          const groupsList = Array.isArray(groupsRes) ? groupsRes : (groupsRes?.data || []);
          setGroups(groupsList);
        } catch (e) {
          console.error("Failed to fetch groups independently", e);
          setGroups(res.groups || []);
        }
      } else {
        setGroups(res.groups || []);
      }

    } catch (error) {
      console.error('Failed to load community:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await api.joinGroup(id!, groupId, token || undefined);
      Alert.alert('Success', 'You have joined the group!');
      setJoinedGroups(prev => [...prev, groupId]);
      handleRefresh();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error?.message || 'Failed to join group');
    }
  };

  const handleJoinCommunity = async () => {
    if (!id) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const res = await api.joinCommunity(id, token || undefined) as any;
      
      const status = res?.status;
      if (status === 'pending') {
        setCommunity(prev => prev ? ({ ...prev, isPending: true }) : null);
      } else if (status === 'joined') {
        setCommunity(prev => prev ? ({ ...prev, isMember: true }) : null);
      }
      
      handleRefresh();
    } catch (error) {
      console.error(error);
    }
  };

  const handleMenu = () => {
    if (!community) return;

    const options = [
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (community.memberRole === 'admin' || community.memberRole === 'owner') {
      options.push({
        text: 'Community Settings',
        onPress: () => router.push(`/communities/${id}/settings`)
      } as any);
    }

    if (community.isMember && community.memberRole !== 'owner') {
      options.push({
        text: 'Leave Community',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('Leave Community', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Leave',
              style: 'destructive',
              onPress: async () => {
                await api.leaveCommunity(id!, token || undefined);
                router.replace('/communities');
              }
            }
          ]);
        }
      } as any);
    }

    Alert.alert('Options', undefined, options);
  };

  const renderHeader = () => {
    if (!community) return null;

    return (
      <View style={[styles.headerContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Image
            source={community.avatar}
            style={[styles.avatar, { borderColor: colors.border }]}
            contentFit="cover"
            transition={200}
          />
          
          <View style={styles.titleColumn}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.text }]}>{community.name}</Text>
              {community.isVerified && (
                <ShieldCheck size={16} color={colors.primary} style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={[styles.stats, { color: colors.textSecondary }]}>
              {community.memberCount} members
            </Text>
          </View>
        </View>

        {community.description ? (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {community.description}
          </Text>
        ) : null}

        {/* Join Button if not member */}
        {!community.isMember && (
           <TouchableOpacity
             style={[
               styles.joinButton, 
               { 
                 backgroundColor: community.isPending ? colors.card : colors.primary,
                 borderWidth: community.isPending ? 1 : 0,
                 borderColor: colors.border
               }
             ]}
             onPress={community.isPending ? undefined : handleJoinCommunity}
             disabled={community.isPending}
           >
             <Text style={[
               styles.joinButtonText, 
               community.isPending && { color: colors.textSecondary }
             ]}>
               {community.isPending ? 'Requested' : 'Join Community'}
             </Text>
           </TouchableOpacity>
        )}
        
        <View style={[styles.sectionHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Groups</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: '', // Empty title on stack header, we show it in content
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleMenu}>
              <MoreHorizontal color={colors.text} size={24} />
            </TouchableOpacity>
          )
        }}
      />

      <FlatList
        data={groups}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <CommunityGroupCard
            group={item}
            onPress={() => router.push({
              pathname: '/communities/[id]/groups/[groupId]',
              params: { id, groupId: item._id }
            })}
            onJoin={() => handleJoinGroup(item._id)}
            showJoin={
               !item.isMember &&
               community?.memberRole !== 'owner' &&
               community?.memberRole !== 'admin' &&
               !joinedGroups.includes(item._id)
            }
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          <View style={[styles.emptyState]}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Groups Yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              Groups will appear here once created.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB for Admins */}
      {(community?.memberRole === 'admin' || community?.memberRole === 'owner') && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/communities/${id}/create-group`)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 16,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  stats: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  joinButton: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionHeader: {
    paddingVertical: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  }
});
