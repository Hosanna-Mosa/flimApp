import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { Check, X } from 'lucide-react-native';

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      if (!id) return;
      const res = await api.community(id, token || undefined) as any;
      // pendingRequests is now populated by backend for admins
      setRequests(res?.pendingRequests || []);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load requests');
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

  const handleApprove = async (userId: string) => {
    try {
      await api.approveJoinRequest(id!, userId, token || undefined);
      loadData(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to approve request');
    }
  };

  const handleReject = async (userId: string) => {
    try {
      await api.rejectJoinRequest(id!, userId, token || undefined);
      loadData(); // Refresh list
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{ 
          title: 'Join Requests',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false
        }} 
      />

      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={[styles.item, { borderBottomColor: colors.border }]}>
            <Image
              source={{ uri: item.avatar || 'https://via.placeholder.com/40' }}
              style={styles.avatar}
            />
            <View style={styles.info}>
              <Text style={[styles.name, { color: colors.text }]}>
                {item.name} {item.isVerified && '✓'}
              </Text>
              {item.bio && (
                <Text style={[styles.bio, { color: colors.textSecondary }]} numberOfLines={1}>
                  {item.bio}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FFEDED' }]}
                onPress={() => handleReject(item._id)}
              >
                <X size={20} color="#FF4444" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#E8F5E9' }]}
                onPress={() => handleApprove(item._id)}
              >
                <Check size={20} color="#4CAF50" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.textSecondary }}>No pending requests</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.list}
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
    padding: 32,
  },
  list: {
    padding: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  },
  bio: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
