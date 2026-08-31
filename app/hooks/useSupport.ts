import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Support-screen logic: the reason text, an optional screenshot (picked as
 * base64 and sent inline as a data URL), and submission.
 */
export function useSupport() {
  const router = useRouter();
  const { token } = useAuth();
  const [reason, setReason] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        setImageBase64(result.assets[0].base64 || null);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeImage = () => {
    setImageUri(null);
    setImageBase64(null);
  };

  const submit = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for your support request');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'You must be logged in to submit a support request');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        reason: reason.trim(),
        imageUrl: imageBase64 ? 'data:image/jpeg;base64,' + imageBase64 : null,
      };

      await api.createSupportRequest(payload, token);

      Alert.alert('Success', 'Your support request has been submitted successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('Support submission error:', error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    reason,
    setReason,
    imageUri,
    pickImage,
    removeImage,
    isLoading,
    canSubmit: !!reason.trim(),
    submit,
  };
}
