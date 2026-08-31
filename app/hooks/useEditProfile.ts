import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaToCloudinary } from '@/utils/media';

export interface EditProfileValues {
  name: string;
  username: string;
  bio: string;
  location: string;
  experience: string;
  avatar: string;
}

/**
 * Edit Profile logic: form state seeded from the signed-in user, avatar
 * picking (uploaded to Cloudinary on save when it is a new local file), and
 * the profile update.
 */
export function useEditProfile() {
  const router = useRouter();
  const { user, updateProfile, token } = useAuth();

  const [values, setValues] = useState<EditProfileValues>({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    experience: user?.experience.toString() || '0',
    avatar: user?.avatar || '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const setField = <K extends keyof EditProfileValues>(field: K, value: EditProfileValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  /** Only alphanumeric, underscores and periods; always lower-case. */
  const setUsername = (text: string) => {
    const sanitized = text.replace(/[^a-zA-Z0-9._]/g, '');
    setField('username', sanitized.toLowerCase());
  };

  const pickAvatar = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setField('avatar', result.assets[0].uri);
    }
  };

  const save = async () => {
    const { name, username, bio, location, experience, avatar } = values;
    try {
      setSaving(true);

      let finalAvatarUrl = avatar;

      // If avatar has changed and is a local file, upload it
      if (avatar && avatar !== user?.avatar && !avatar.startsWith('http')) {
        try {
          const uploadResult = await uploadMediaToCloudinary({ uri: avatar }, 'image', token || '');
          if (uploadResult && uploadResult.url) {
            finalAvatarUrl = uploadResult.url;
          }
        } catch (uploadError: any) {
          console.error('Avatar upload failed:', uploadError);
          // Optional: Ask user if they want to continue without avatar or stop
        }
      }

      // Prepare update payload
      const updates = {
        name,
        username: username.toLowerCase().trim().replace(/[^a-zA-Z0-9._]/g, ''),
        bio,
        location,
        experience: parseInt(experience) || 0,
        avatar: finalAvatarUrl,
      };

      // Call updateProfile which now calls the backend
      await updateProfile(updates);

      Alert.alert('Success', 'Profile updated successfully!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      console.error('[EditProfile] Error saving:', error);
      const message = error.message || 'Failed to update profile. Please try again.';
      Alert.alert('Error', message, [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  return { user, values, setField, setUsername, pickAvatar, saving, save };
}
