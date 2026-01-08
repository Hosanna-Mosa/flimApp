import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { INDUSTRIES } from '@/constants/industries';
import SelectableCard from '@/components/SelectableCard';
import Button from '@/components/Button';
import { api } from '@/utils/api';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Camera } from 'lucide-react-native';
import { uploadMediaToCloudinary } from '@/utils/media';

const DEFAULT_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/png?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Aneka',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Bob',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Willow',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Scooby',
  'https://api.dicebear.com/7.x/avataaars/png?seed=Garfield',
];

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useTheme();
  const { setAuth } = useAuth();

  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleToggleRole = (id: string) => {
    if (selectedRoles.includes(id)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== id));
    } else {
      setSelectedRoles([...selectedRoles, id]);
    }
  };

  const handleToggleIndustry = (id: string) => {
    if (selectedIndustries.includes(id)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== id));
    } else {
      setSelectedIndustries([...selectedIndustries, id]);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your media library to choose an avatar.');
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

  const handleContinue = async () => {
    if (step === 1) {
      if (!avatar) {
        Alert.alert('Avatar Required', 'Please choose a profile picture to continue.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedRoles.length === 0) return;
      setStep(3);
    } else {
      // Register
      setLoading(true);
      try {
        const { name, phone, email, password } = params;
        const payload = {
          name: name as string,
          phone: phone as string,
          email: email as string,
          password: password as string,
          roles: selectedRoles,
          industries: selectedIndustries
        };

        // 1. Register User
        const response = await api.register(payload);
        const { accessToken, refreshToken, user } = response;

        // 2. Upload Avatar if selected
        let finalAvatarUrl = '';
        if (avatar) {
          // Check if it's a remote URL (default avatar) or local file
          if (avatar.startsWith('http')) {
            finalAvatarUrl = avatar;
          } else {
            try {
              const uploadResult = await uploadMediaToCloudinary(
                { uri: avatar },
                'image',
                accessToken
              );
              finalAvatarUrl = uploadResult.url;
            } catch (uploadError) {
              console.error('Avatar upload failed:', uploadError);
            }
          }

          if (finalAvatarUrl) {
            // 3. Update User Profile with Avatar URL
            try {
              await api.updateMe({ avatar: finalAvatarUrl }, accessToken);
              // Update local user object to include the new avatar
              (user as any).avatar = finalAvatarUrl;
            } catch (updateError) {
              console.error('Failed to update profile with avatar:', updateError);
            }
          }
        }

        setAuth({
          token: accessToken,
          refreshToken: refreshToken,
          user: user as any,
        });

        router.replace('/home');
      } catch (err: any) {
        Alert.alert('Registration Failed', err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {step === 1 ? 'Choose Your Avatar' : step === 2 ? 'Select Your Roles' : 'Select Industries'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {step === 1
              ? 'Select a profile picture to represent you'
              : step === 2
                ? 'Choose all that apply (you can change this later)'
                : 'Which film industries are you interested in?'}
          </Text>
        </View>

        <View style={styles.listContainer}>
          {step === 1 ? (
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
                    <Camera size={40} color={colors.textSecondary} />
                  </View>
                )}
                <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                  <Camera size={14} color="#FFF" />
                </View>
              </TouchableOpacity>
              <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
                Shape your identity! Upload or pick one below.
              </Text>

              <View style={styles.defaultAvatarsContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Or choose a default:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarList}>
                  {DEFAULT_AVATARS.map((uri, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setAvatar(uri)}
                      style={[
                        styles.defaultAvatarItem,
                        avatar === uri && { borderColor: colors.primary, borderWidth: 2 }
                      ]}
                    >
                      <Image source={{ uri }} style={styles.defaultAvatarImage} contentFit="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : step === 2 ? (
            ROLES.map((role) => (
              <SelectableCard
                key={role.id}
                id={role.id}
                label={role.label}
                icon={role.icon}
                selected={selectedRoles.includes(role.id)}
                onToggle={handleToggleRole}
              />
            ))
          ) : (
            INDUSTRIES.map((industry) => (
              <SelectableCard
                key={industry.id}
                id={industry.id}
                label={industry.label}
                description={industry.description}
                selected={selectedIndustries.includes(industry.id)}
                onToggle={handleToggleIndustry}
                color={industry.color}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title={step === 3 ? "Complete Setup" : "Next"}
          onPress={handleContinue}
          size="large"
          loading={loading}
          disabled={
            (step === 1 && !avatar) ||
            (step === 2 && selectedRoles.length === 0) ||
            (step === 3 && selectedIndustries.length === 0)
          }
        />
        {step > 1 && (
          <Button
            title="Back"
            onPress={() => setStep(step - 1)}
            variant="outline"
            style={{ marginTop: 10 }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    marginTop: 20
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  listContainer: {
    gap: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  avatarPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  avatarHint: {
    fontSize: 14,
    marginBottom: 24,
  },
  defaultAvatarsContainer: {
    width: '100%',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  avatarList: {
    gap: 12,
    paddingHorizontal: 4,
  },
  defaultAvatarItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  defaultAvatarImage: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
});
