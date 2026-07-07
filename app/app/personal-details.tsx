import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronRight, Briefcase } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

export default function PersonalDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile, token } = useAuth();
  
  // Initialize email, but show empty if it's a placeholder email
  const initialEmail = (user as any)?.email || '';
  const isPlaceholderEmail = initialEmail.includes('@placeholder.com') || initialEmail.includes('@film.app');
  const [email, setEmail] = useState<string>(isPlaceholderEmail ? '' : initialEmail);
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [location, setLocation] = useState<string>(user?.location || '');
  const [experience, setExperience] = useState<string>(
    (user?.experience?.toString() || '0')
  );
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [saving, setSaving] = useState<boolean>(false);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate email format (if provided)
      if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        Alert.alert('Error', 'Please enter a valid email address');
        setSaving(false);
        return;
      }

      // Validate phone format (basic)
      if (phone && phone.trim().length < 10) {
        Alert.alert('Error', 'Please enter a valid phone number (at least 10 digits)');
        setSaving(false);
        return;
      }

      // Prepare update payload
      const updates: any = {
        location: location.trim(),
        experience: parseInt(experience) || 0,
        bio: bio.trim(),
      };

      // Only include email if it's provided and different
      if (email && email.trim()) {
        const trimmedEmail = email.toLowerCase().trim();
        if (trimmedEmail !== (user as any)?.email) {
          updates.email = trimmedEmail;
        }
      }
      
      // Only include phone if it's provided and different
      if (phone && phone.trim()) {
        const trimmedPhone = phone.trim();
        if (trimmedPhone !== user?.phone) {
          updates.phone = trimmedPhone;
        }
      }

      // console.log('[PersonalDetails] Saving updates:', updates);

      // Call updateProfile which calls the backend
      await updateProfile(updates);

      Alert.alert('Success', 'Personal details updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      // console.error('[PersonalDetails] Error saving:', error);
      Alert.alert(
        'Error',
        error?.message || 'Failed to update personal details. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Personal Details',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Input
            label="Email"
            placeholder="your.email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Input
            label="Location"
            placeholder="City, Country"
            value={location}
            onChangeText={setLocation}
          />

          <Input
            label="Years of Experience"
            placeholder="0"
            value={experience}
            onChangeText={setExperience}
            keyboardType="numeric"
          />

          <Input
            label="Bio"
            placeholder="Tell us about yourself"
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border, marginTop: 16, marginBottom: 24 },
            ]}
            onPress={() => router.push('/portfolio')}
          >
            <View style={styles.settingInfo}>
              <Briefcase size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Manage Portfolio
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Configure and showcase your project links
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Button
            title="Save Changes"
            onPress={handleSave}
            size="large"
            loading={saving}
            style={styles.saveButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  saveButton: {
    marginTop: 8,
  },
});

