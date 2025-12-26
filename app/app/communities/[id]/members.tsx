import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { MoreVertical } from 'lucide-react-native';

export default function CommunityMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState<string | null>(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadMembers(0, true);
  }, [id]);

  const loadMembers = async (pageNum: number, reset = false) => {
    try {
      if (!id) return;
      if (reset) setLoading(true);
      else setLoadingMore(true);

      // Get my role (only needed once really, but fine here)
      if (reset) {
        const comRes = await api.community(id, token || undefined) as any;
        setMyRole(comRes?.memberRole);
      }

      const memRes = await api.communityMembers(id, pageNum, 20, token || undefined) as any;
      
      const newMembers = memRes?.data || [];
      setMembers(prev => reset ? newMembers : [...prev, ...newMembers]);
      setHasMore(newMembers.length >= 20);
      setPage(pageNum);
      
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadMembers(page + 1, false);
    }
  };

  const handleMemberAction = (member: any) => {
    // Cannot act on yourself
    // Cannot act on owner
    // Must be admin to act

    if (myRole !== 'admin' && myRole !== 'owner') return;
    if (member.role === 'owner') return;

    const options = [
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (member.role !== 'admin') {
      options.push({
        text: 'Promote to Admin',
        onPress: () => updateRole(member.user._id, 'admin')
      } as any);
    }

    if (member.role === 'admin') {
      options.push({
        text: 'Demote to Member',
        onPress: () => updateRole(member.user._id, 'member')
      } as any);
    }

    options.push({
      text: 'Remove from Community',
      style: 'destructive' as const,
      onPress: () => removeMember(member.user._id)
    } as any);

    Alert.alert(
      'Manage Member',
      `Actions for ${member.user.name}`,
      options
    );
  };

  const updateRole = async (userId: string, role: 'admin' | 'moderator' | 'member') => {
    try {
      if (!id) return;
      await api.updateMemberRole(id, userId, role, token || undefined);
      loadMembers(0, true); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const removeMember = async (userId: string) => {
    try {
      if (!id) return;
      await api.removeMember(id, userId, token || undefined);
      loadMembers(0, true); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Members',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false
        }} 
      />

      <FlatList
        data={members}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.memberRow, { borderBottomColor: colors.border }]}>
            <Image
              source={item.user.avatar || 'https://via.placeholder.com/100'}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.user.name}
                {item.role === 'owner' && <Text style={{ color: colors.primary, fontSize: 12 }}> (Owner)</Text>}
                {item.role === 'admin' && <Text style={{ color: colors.primary, fontSize: 12 }}> (Admin)</Text>}
              </Text>
              <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.user.bio || 'No bio'}
              </Text>
            </View>

            {(myRole === 'admin' || myRole === 'owner') && item.role !== 'owner' && (
              <TouchableOpacity onPress={() => handleMemberAction(item)}>
                <MoreVertical color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>No members found.</Text>
          </View>
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.primary} style={{ margin: 20 }} /> : null}
      />
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
    padding: 24,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
  }
});
