import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { uploadMediaToCloudinary } from '@/utils/media';
import { formatConflictMessage } from '@/utils/authErrors';
import { PresetAvatar } from '@/constants/avatars';

interface OnboardingSelection {
  avatar: string | null;
  presetAvatar: PresetAvatar | null;
  selectedLanguage: string | null;
  selectedRoles: string[];
  selectedIndustries: string[];
}

/**
 * The "Complete Setup" flow: log in / register if the OTP step left us
 * unauthenticated, save language + roles + industries, upload the chosen
 * avatar (preset SVG or gallery photo) and land on Home.
 */
export function useOnboardingSubmit() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token, refreshToken: authRefreshToken, user: authUser, setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  const submit = async ({
    avatar,
    presetAvatar,
    selectedLanguage,
    selectedRoles,
    selectedIndustries,
  }: OnboardingSelection) => {
    // Finalize Profile (Register or Update)
    setLoading(true);
    try {
      let accessToken = token;
      let refreshToken = authRefreshToken;
      let user = authUser;

      // If not authenticated (should not happen normally after OTP, but handle just in case)
      if (!accessToken || !user) {

        const { name, phone, email, password, username } = params;

        // Check if we can just log in instead of registering if user was already created during OTP
        if (phone && password) {
          try {

            const loginResult = await api.loginPassword({
              phone: phone as string,
              password: password as string
            });
            accessToken = loginResult.accessToken;
            refreshToken = loginResult.refreshToken;
            user = loginResult.user as any;


            // Update Auth Context since we were missing it
            setAuth({
              token: accessToken!,
              refreshToken: refreshToken || '',
              user: user as any
            });
          } catch (loginErr) {
            console.error('[Onboarding] Login fallback failed:', loginErr);
          }
        }

        // If still no token, only then try to register
        if (!accessToken || !user) {
          // Validate required fields before attempting registration
          if (!name || !phone || !email || !password) {
            throw new Error('Missing required registration fields. Please start over from signup.');
          }

          const payload = {
            name: name as string,
            phone: phone as string,
            email: email as string,
            password: password as string,
            username: username as string,
            language: selectedLanguage,
            roles: selectedRoles,
            industries: selectedIndustries
          };

          // Check availability before registering
          const check = await api.checkAvailability({
            email: email as string,
            phone: phone as string,
            password: password as string
          });
          if (!check.available) {
            if (check.fields && Array.isArray(check.fields)) {
              throw new Error(formatConflictMessage(check.fields));
            } else {
              throw new Error(check.message || 'One or more fields are already registered.');
            }
          }

          const response = await api.register(payload);
          accessToken = response.accessToken;
          refreshToken = response.refreshToken;
          user = response.user as any;
        }
      } else {
        // User is already authenticated (via OTP), just update profile
        await api.updateMe({
          language: selectedLanguage,
          roles: selectedRoles,
          industries: selectedIndustries
        }, accessToken!);

        // Update local user object
        if (user) {
          (user as any).language = selectedLanguage;
          (user as any).roles = selectedRoles;
          (user as any).industries = selectedIndustries;
        }
      }

      // 2. Upload Avatar if selected
      let finalAvatarUrl = '';
      if (presetAvatar && accessToken) {
        // Pre-designed avatar: write the SVG to cache and upload through the
        // normal signed flow, then request PNG delivery so every consumer
        // (app screens, web, push) can render it.
        try {
          const fileUri = `${FileSystem.cacheDirectory}preset-avatar-${presetAvatar.id}.svg`;
          await FileSystem.writeAsStringAsync(fileUri, presetAvatar.svg);
          const uploadResult = await uploadMediaToCloudinary(
            { uri: fileUri, type: 'image/svg+xml', name: `avatar-${presetAvatar.id}.svg` },
            'image',
            accessToken
          );
          finalAvatarUrl = uploadResult.url
            .replace('/upload/', '/upload/w_512/')
            .replace(/\.svg$/, '.png');
        } catch (uploadError) {
          console.error('Preset avatar upload failed:', uploadError);
        }
      } else if (avatar && accessToken) {
        // Check if it's a remote URL (default avatar) or local file
        if (avatar.startsWith('http')) {
          finalAvatarUrl = avatar;
        } else {
          try {
            const uploadResult = await uploadMediaToCloudinary(
              { uri: avatar },
              'image',
              accessToken // use the token we have
            );
            finalAvatarUrl = uploadResult.url;
          } catch (uploadError) {
            console.error('Avatar upload failed:', uploadError);
          }
        }
      }

      if (finalAvatarUrl && accessToken) {
        // 3. Update User Profile with Avatar URL
        try {
          await api.updateMe({ avatar: finalAvatarUrl }, accessToken);
          // Update local user object to include the new avatar
          if (user) (user as any).avatar = finalAvatarUrl;
        } catch (updateError) {
          console.error('Failed to update profile with avatar:', updateError);
        }
      }

      // Update Auth Context
      if (accessToken && user) {
        const updatedUser = {
          ...user,
          language: (user as any).language || selectedLanguage,
          roles: (user as any).roles || selectedRoles,
          industries: (user as any).industries || selectedIndustries,
          avatar: (user as any).avatar || finalAvatarUrl
        };

        await setAuth({
          token: accessToken,
          refreshToken: refreshToken || '',
          user: updatedUser as any,
        });
      }

      router.replace('/home');
    } catch (err: any) {
      // Handle registration errors with conflicts
      let errorMessage = err.message || 'Something went wrong';
      if (err.conflicts && Array.isArray(err.conflicts)) {
        errorMessage = formatConflictMessage(err.conflicts);
      }
      Alert.alert('Setup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading };
}
