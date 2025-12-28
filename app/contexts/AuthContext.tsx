import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { User, UserRole, Industry } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}


// Push Notification Logic
// import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import api from '@/utils/api';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Only set handler if NOT in Expo Go on Android (or just not in Expo Go generally to be safe)
// Only set handler if NOT in Expo Go
// if (!isExpoGo) {
//   try {
//     Notifications.setNotificationHandler({
//       handleNotification: async () => ({
//         shouldShowAlert: true,
//         shouldPlaySound: true,
//         shouldSetBadge: true,
//         shouldShowBanner: true,
//         shouldShowList: true,
//       }),
//     });
//   } catch (e) {
//     // console.warn('Failed to set notification handler:', e);
//   }
// }

async function registerForPushNotificationsAsync() {
  return null;
  /*
  if (isExpoGo) {
    // console.log('[Notification] Push notifications are not supported in Expo Go. Skipping.');
    return null;
  }

  // Double check strict check for physical device
  if (!Device.isDevice) {
    // console.log('[Notification] Must use physical device for Push Notifications');
    return null;
  }

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      // console.log('[Notification] Failed to set notification channel', e);
    }
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      // console.log('Failed to get push token for push notification!');
      return;
    }

    // Project ID is sometimes required in newer Expo versions
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const pushTokenString = (await Notifications.getExpoPushTokenAsync({
      projectId,
    })).data;
    // console.log('Expo Push Token:', pushTokenString);
    return pushTokenString;
  } catch (e) {
    // console.error('Error getting push token:', e);
    return null;
  }
  */
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    hasCompletedOnboarding: false,
  });

  useEffect(() => {
    loadAuthState();
  }, []);

  const registerPushToken = async (authToken: string) => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && authToken) {
        await api.registerPushToken(pushToken, authToken);
        // console.log('[Auth] Push token registered with backend');
      }
    } catch (error) {
      // console.error('[Auth] Failed to register push token:', error);
    }
  };

  const loadAuthState = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      const onboardingComplete = await AsyncStorage.getItem(
        'onboarding_complete'
      );

      if (userJson && token) {
        const user = JSON.parse(userJson);
        setAuthState({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
          hasCompletedOnboarding: onboardingComplete === 'true',
        });

        // Register push token silently on load
        registerPushToken(token);

      } else {
        setAuthState({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          hasCompletedOnboarding: false,
        });
      }
    } catch (error) {
      // console.error('Error loading auth state:', error);
      setAuthState({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        hasCompletedOnboarding: false,
      });
    }
  };

  const login = async (phone: string) => {
    const newUser: User = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${phone}`,
      bio: '',
      roles: [],
      industries: [],
      experience: 0,
      location: '',
      isOnline: true,
      isPrivate: false,
    };

    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setAuthState({
      user: newUser,
      token: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  };

  const updateUserRoles = async (roles: UserRole[]) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, roles };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    setAuthState((prev) => ({ ...prev, user: updatedUser }));
  };

  const updateUserIndustries = async (industries: Industry[]) => {
    if (!authState.user) return;

    const updatedUser = { ...authState.user, industries };
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    await AsyncStorage.setItem('onboarding_complete', 'true');
    setAuthState((prev) => ({
      ...prev,
      user: updatedUser,
      hasCompletedOnboarding: true,
    }));
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user || !authState.token) return;

    try {
      // Import api at the top if not already imported
      const api = require('@/utils/api').default;

      // Call backend API to update profile
      const updatedUserData = await api.updateMe(updates, authState.token);

      // Merge the response with current user data
      const updatedUser = { ...authState.user, ...updatedUserData };

      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      // Update state
      setAuthState((prev) => ({ ...prev, user: updatedUser }));

      return { success: true, user: updatedUser };
    } catch (error) {
      // console.error('[AuthContext] Error updating profile:', error);
      throw error;
    }
  };

  const setAuth = async (data: {
    user: User;
    token: string;
    refreshToken: string;
  }) => {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);
    if (data.user.roles.length > 0 && data.user.industries.length > 0) {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    }

    setAuthState({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding:
        data.user.roles.length > 0 && data.user.industries.length > 0,
    });

    // Register push token on login
    registerPushToken(data.token);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('onboarding_complete');
    setAuthState({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      hasCompletedOnboarding: false,
    });
  };

  return {
    ...authState,
    login,
    logout,
    updateUserRoles,
    updateUserIndustries,
    updateProfile,
    setAuth,
  };
});
