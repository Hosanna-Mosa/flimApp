import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { Image } from 'expo-image';
import { Camera, Upload } from 'lucide-react-native';

export default function CreateCommunityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'industry' | 'role' | 'project' | 'general'>('general');
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'invite-only'>('public');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock function for image picker since it requires Expo Image Picker setup
  const handlePickImage = () => {
    Alert.alert('Image Picker', 'This would open the image picker in a real app.');
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    try {
      setLoading(true);
      await api.createCommunity({
        name,
        description,
        type,
        privacy,
        industry: type === 'industry' ? industry : undefined
      }, token || undefined);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ title: 'New Community', headerBackTitle: 'Cancel' }} />

      <View style={styles.form}>
        {/* Avatar Upload */}
        <View style={styles.uploadSection}>
          <TouchableOpacity
            style={[styles.avatarUpload, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handlePickImage}
          >
            <Camera size={32} color={colors.textSecondary} />
            <Text style={[styles.uploadText, { color: colors.textSecondary }]}>Upload Icon</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Info */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Community Name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="e.g. Bollywood Directors"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
            maxLength={50}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="What is this community about?"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Community Type</Text>
          <View style={styles.typeContainer}>
            {(['industry', 'role', 'project', 'general'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.typeChip,
                  type === t ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }
                ]}
                onPress={() => setType(t)}
              >
                <Text style={[
                  styles.typeText,
                  type === t ? { color: '#fff' } : { color: colors.text }
                ]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {type === 'industry' && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.text }]}>Industry</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g. Bollywood, Tollywood"
              placeholderTextColor={colors.textSecondary}
              value={industry}
              onChangeText={setIndustry}
            />
          </View>
        )}

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Privacy</Text>
          <View style={[styles.privacyOption, { borderColor: colors.border }]}>
            <View>
              <Text style={[styles.privacyTitle, { color: colors.text }]}>Private Community</Text>
              <Text style={[styles.privacyDesc, { color: colors.textSecondary }]}>
                Only members can view posts and groups.
              </Text>
            </View>
            <Switch
              value={privacy === 'private'}
              onValueChange={(val) => setPrivacy(val ? 'private' : 'public')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.privacyOption, { borderColor: colors.border, marginTop: 12 }]}>
            <View>
              <Text style={[styles.privacyTitle, { color: colors.text }]}>Invite Only</Text>
              <Text style={[styles.privacyDesc, { color: colors.textSecondary }]}>
                Members require approval to join.
              </Text>
            </View>
            <Switch
              value={privacy === 'invite-only'}
              onValueChange={(val) => setPrivacy(val ? 'invite-only' : 'public')}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Community'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  uploadSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarUpload: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 12,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyDesc: {
    fontSize: 13,
  },
  createButton: {
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
