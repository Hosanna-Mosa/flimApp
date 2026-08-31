import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

export interface PersonalDetailsValues {
  email: string;
  phone: string;
  location: string;
  experience: string;
  bio: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Personal Details logic: seeds the form from the signed-in user (hiding
 * placeholder emails), validates, and sends only the changed contact fields.
 */
export function usePersonalDetails() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();

  // Initialize email, but show empty if it's a placeholder email
  const initialEmail = (user as any)?.email || '';
  const isPlaceholderEmail = initialEmail.includes('@placeholder.com') || initialEmail.includes('@film.app');

  const [values, setValues] = useState<PersonalDetailsValues>({
    email: isPlaceholderEmail ? '' : initialEmail,
    phone: user?.phone || '',
    location: user?.location || '',
    experience: user?.experience?.toString() || '0',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState<boolean>(false);

  const setField = <K extends keyof PersonalDetailsValues>(field: K, value: PersonalDetailsValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  const save = async () => {
    const { email, phone, location, experience, bio } = values;
    try {
      setSaving(true);

      // Validate email format (if provided)
      if (email && email.trim() && !EMAIL_RE.test(email.trim())) {
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

      // Call updateProfile which calls the backend
      await updateProfile(updates);

      Alert.alert('Success', 'Personal details updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update personal details. Please try again.', [
        { text: 'OK' },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const openPortfolio = () => router.push('/portfolio');

  return { values, setField, saving, save, openPortfolio };
}
