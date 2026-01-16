import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { ChevronRight, Users, Trash2, Save, UserCheck, Lock } from 'lucide-react-native';

export default function CommunitySettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [community, setCommunity] = useState<any>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite-only'>('public');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      if (!id) return;
      const res = await api.community(id, token || undefined) as any;
      setCommunity(res);
      setName(res?.name || '');
      setDescription(res?.description || '');
      setPrivacy(res?.privacy || 'public');

      // Check permissions
      const role = res?.memberRole;
      if (role !== 'owner' && role !== 'admin') {
        Alert.alert('Access Denied', 'You do not have permission to view settings.');
        router.back();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to load community settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateCommunity(id!, {
        name,
        description,
        privacy
      }, token || undefined);
      Alert.alert('Success', 'Community settings updated');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update community');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Community',
      'Are you sure you want to delete this community? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCommunity(id!, token || undefined);
              router.replace('/communities');
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'Failed to delete community');
            }
          }
        }
      ]
    );
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
          title: 'Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.primary} /> : <Save color={colors.primary} size={24} />}
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>GENERAL</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Community Name"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroupNoBorder}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
              <TextInput
                style={[styles.input, { color: colors.text, height: 80 }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your community..."
                placeholderTextColor={colors.textSecondary}
                multiline
              />
            </View>
          </View>
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PRIVACY</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => setPrivacy('public')}
            >
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Public</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Anyone can join and view posts</Text>
              </View>
              {privacy === 'public' && <UserCheck color={colors.primary} size={20} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.row}
              onPress={() => setPrivacy('private')}
            >
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Private</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>Admin approval required to join</Text>
              </View>
              {privacy === 'private' && <Lock color={colors.primary} size={20} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Members Management Link */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>MEMBERS</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TouchableOpacity
              style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              onPress={() => router.push(`/communities/${id}/requests`)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                  <UserCheck size={20} color={colors.text} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Join Requests</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {community?.pendingRequests?.length > 0 && (
                  <View style={{ backgroundColor: '#FF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>
                      {community.pendingRequests.length}
                    </Text>
                  </View>
                )}
                <ChevronRight size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push(`/communities/${id}/members`)}
            >
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { backgroundColor: colors.background }]}>
                  <Users size={20} color={colors.text} />
                </View>
                <Text style={[styles.menuItemText, { color: colors.text }]}>Manage Members</Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger Zone */}
        {community?.memberRole === 'owner' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.error }]}>DANGER ZONE</Text>
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, alignItems: 'center' }]}
              onPress={handleDelete}
            >
              <Text style={[styles.deleteText, { color: colors.error }]}>Delete Community</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
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
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputGroup: {
    padding: 16,
    borderBottomWidth: 1,
  },
  inputGroupNoBorder: {
    padding: 16,
  },
  label: {
    fontSize: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
  }
});
