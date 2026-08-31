import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import Avatar from '@/components/ui/Avatar';
import { EditProfileValues } from '@/hooks/useEditProfile';

interface EditProfileFormProps {
  values: EditProfileValues;
  onChange: <K extends keyof EditProfileValues>(field: K, value: EditProfileValues[K]) => void;
  /** Username has its own setter so the form doesn't own the sanitising rule. */
  onChangeUsername: (text: string) => void;
  onPickAvatar: () => void;
  onSave: () => void;
  saving: boolean;
  /** Used by Avatar to derive a stable fallback image. */
  userId?: string;
  userName?: string;
}

/** Avatar preview with a camera button, the profile fields, and Save. */
export default function EditProfileForm({
  values,
  onChange,
  onChangeUsername,
  onPickAvatar,
  onSave,
  saving,
  userId,
  userName,
}: EditProfileFormProps) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.avatarSection}>
        <Avatar uri={values.avatar} userId={userId} name={userName} size={120} />
        <TouchableOpacity
          style={[styles.changeAvatarButton, { backgroundColor: colors.primary }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          onPress={onPickAvatar}
        >
          <Camera size={20} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <Input label="Name" placeholder="Your name" value={values.name} onChangeText={(text) => onChange('name', text)} />

      <Input
        label="Username"
        placeholder="Choose a unique username"
        value={values.username}
        onChangeText={onChangeUsername}
        autoCapitalize="none"
      />

      <Input
        label="Bio"
        placeholder="Tell us about yourself"
        value={values.bio}
        onChangeText={(text) => onChange('bio', text)}
        multiline
        numberOfLines={4}
        style={styles.bioInput}
      />

      <Input
        label="Location"
        placeholder="City, Country"
        value={values.location}
        onChangeText={(text) => onChange('location', text)}
      />

      <Input
        label="Years of Experience"
        placeholder="0"
        value={values.experience}
        onChangeText={(text) => onChange('experience', text)}
        keyboardType="numeric"
      />

      <Button title="Save Changes" onPress={onSave} size="large" loading={saving} />
    </>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
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
