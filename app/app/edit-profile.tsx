import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState<string>(user?.name || '');
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [location, setLocation] = useState<string>(user?.location || '');
  const [experience, setExperience] = useState<string>(
    user?.experience.toString() || '0'
  );
  const [avatar, setAvatar] = useState<string>(user?.avatar || '');
  const [saving, setSaving] = useState<boolean>(false);

  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Prepare update payload
      const updates = {
        name,
        bio,
        location,
        experience: parseInt(experience) || 0,
        avatar,
      };
      
      // console.log('[EditProfile] Saving updates:', updates);
      
      // Call updateProfile which now calls the backend
      await updateProfile(updates);
      
      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      // console.error('[EditProfile] Error saving:', error);
      Alert.alert(
        'Error',
        'Failed to update profile. Please try again.',
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
          headerTitle: 'Edit Profile',
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
          <View style={styles.avatarSection}>
            <Image
              source={{ uri: avatar }}
              style={styles.avatar}
              contentFit="cover"
            />
            <TouchableOpacity
              style={[
                styles.changeAvatarButton,
                { backgroundColor: colors.primary },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={handlePickImage}
            >
              <Camera size={20} color="#000000" />
            </TouchableOpacity>
          </View>

          <Input
            label="Name"
            placeholder="Your name"
            value={name}
            onChangeText={setName}
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

          <Button
            title="Save Changes"
            onPress={handleSave}
            size="large"
            loading={saving}
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});
