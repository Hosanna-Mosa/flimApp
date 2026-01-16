import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Alert,
  Switch,
  ScrollView
} from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { Save } from 'lucide-react-native';

export default function CreateGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncementOnly, setIsAnnouncementOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      setLoading(true);
      await api.createGroup(id!, {
        name,
        description,
        type: isAnnouncementOnly ? 'announcement' : 'discussion',
        isAnnouncementOnly
      }, token || undefined);
      
      Alert.alert('Success', 'Group created successfully');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen 
        options={{
          title: 'Create Group',
          headerRight: () => (
            <TouchableOpacity onPress={handleCreate} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '600' }}>Create</Text>
              )}
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          
          <View style={[styles.inputGroup, { borderBottomColor: colors.border }]}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Group Name</Text>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Project Discussions"
              placeholderTextColor={colors.textSecondary}
              autoFocus
            />
          </View>

          <View style={styles.inputGroupNoBorder}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, { color: colors.text, height: 80 }]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is this group for?"
              placeholderTextColor={colors.textSecondary}
              multiline
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SETTINGS</Text>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.row}>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.text }]}>Announcement Only</Text>
                <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>
                  Only admins can post messages
                </Text>
              </View>
              <Switch
                value={isAnnouncementOnly}
                onValueChange={setIsAnnouncementOnly}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    borderRadius: 12,
    marginBottom: 24,
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
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  rowContent: {
    flex: 1,
    paddingRight: 16,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  rowSubtitle: {
    fontSize: 13,
    marginTop: 2,
  }
});
