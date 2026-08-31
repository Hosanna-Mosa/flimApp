import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaToCloudinary } from '@/utils/media';
import { CommunityPrivary, CommunityType } from '@/types';

/**
 * Create Community form logic: fields, type / privacy selection, icon pick
 * (uploaded to Cloudinary on submit) and the create call.
 */
export function useCommunityForm() {
  const router = useRouter();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CommunityType>('general');
  const [privacy, setPrivacy] = useState<CommunityPrivary>('public');
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to choose a community icon.'
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Community name is required');
      return;
    }

    try {
      setLoading(true);

      let avatar: string | undefined;
      if (avatarUri && token) {
        const upload = await uploadMediaToCloudinary(
          { uri: avatarUri, type: 'image/jpeg' },
          'image',
          token
        );
        avatar = upload.url;
      }

      await api.createCommunity(
        {
          name,
          description,
          type,
          privacy,
          industry: type === 'industry' ? industry : undefined,
          avatar,
        },
        token || undefined
      );
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    setName,
    description,
    setDescription,
    type,
    setType,
    privacy,
    setPrivacy,
    industry,
    setIndustry,
    loading,
    avatarUri,
    pickImage,
    submit,
  };
}
