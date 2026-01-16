import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity, 
  RefreshControl,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import api from '@/utils/api';
import { Community } from '@/types';
import CommunityCard from '@/components/communities/CommunityCard';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Users, Globe, Search } from 'lucide-react-native';
import { CommunitySkeleton } from '@/components/skeletons/CommunitySkeleton';

type Tab = 'my' | 'discover';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('my');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(async () => {
    if (authLoading) return;
    
    try {
      setLoading(true);
      let res: any;
      if (activeTab === 'my') {
        if (!token) {
           setCommunities([]);
           return;
        }
        res = await api.myCommunities(0, 20, token) as any;
      } else {
        res = await api.communities({ search: searchQuery }, token || undefined) as any;
      }
      
      setCommunities(res.data || []);
    } catch (error) {
      console.error('Failed to load communities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery, token, authLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [loadData]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleJoin = async (id: string) => {
    try {
      setJoiningId(id);
      const res = await api.joinCommunity(id, token || undefined) as any;
      
      const status = res?.status;
      
      setCommunities(prev => prev.map(c => {
        if (c._id !== id) return c;
        if (status === 'pending') {
          return { ...c, isPending: true };
        } else if (status === 'joined') {
          return { ...c, isMember: true, memberCount: (c.memberCount || 0) + 1 };
        }
        return c;
      }));
      
    } catch (error) {
      console.error('Failed to join:', error);
      // Revert or reload on error
      loadData();
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen 
        options={{
          headerShown: true,
          title: 'Communities',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.push('/communities/create')}
              style={{ padding: 8 }}
            >
              <Plus color={colors.primary} size={24} />
            </TouchableOpacity>
          )
        }}
      />

      <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('my')}
        >
          <Users size={16} color={activeTab === 'my' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'my' ? colors.primary : colors.textSecondary }]}>
            My Communities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && { borderBottomColor: colors.primary }]}
          onPress={() => setActiveTab('discover')}
        >
          <Globe size={16} color={activeTab === 'discover' ? colors.primary : colors.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'discover' ? colors.primary : colors.textSecondary }]}>
            Discover
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'discover' && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <View style={[styles.searchBar, { backgroundColor: colors.card }]}>
            <Search size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search communities..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={{ padding: 16 }}>
           {[1, 2, 3].map(i => <CommunitySkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={communities}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <CommunityCard
              community={item}
              onPress={() => router.push(`/communities/${item._id}`)}
              onJoin={!item.isMember ? () => handleJoin(item._id) : undefined}
              joining={joiningId === item._id}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ color: colors.textSecondary }}>
                Connect with others, join discussions, and stay updated.
              </Text>
              {activeTab === 'my' && (
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={() => setActiveTab('discover')}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Discover Communities</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 16,
  },
  list: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  }
});
