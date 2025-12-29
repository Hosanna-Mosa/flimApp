import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User, UserRole, Industry } from '@/types';
import api from '@/utils/api';

// 🔔 PUSH NOTIFICATIONS
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * --------------------------------------------------
 *  NOTIFICATION HANDLER (foreground notifications)
 * --------------------------------------------------
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // ✅ iOS banner
    shouldShowList: true,   // ✅ iOS notification center
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * --------------------------------------------------
 *  TYPES
 * --------------------------------------------------
 */
interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
}

/**
 * --------------------------------------------------
 *  PUSH TOKEN REGISTRATION
 * --------------------------------------------------
 */
async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[PUSH] Register start');

  if (!Device.isDevice) {
    console.log('[PUSH] Must use physical device');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[PUSH] Permission denied');
    return null;
  }

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  console.log('[PUSH] TOKEN:', token);

  return token;
}

/**
 * --------------------------------------------------
 *  AUTH CONTEXT
 * --------------------------------------------------
 */
export const [AuthProvider, useAuth] = createContextHook(() => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    hasCompletedOnboarding: false,
  });

  /**
   * --------------------------------------------------
   *  REGISTER PUSH TOKEN WITH BACKEND
   * --------------------------------------------------
   */
  const registerPushToken = async (authToken: string) => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && authToken) {
        await api.registerPushToken(pushToken, authToken);
        console.log('[PUSH] Token sent to backend');
      }
    } catch (err) {
      console.log('[PUSH] Failed to register token', err);
    }
  };

  /**
   * --------------------------------------------------
   *  LOAD AUTH STATE
   * --------------------------------------------------
   */
  useEffect(() => {
    loadAuthState();
  }, []);

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

        // 🔔 REGISTER PUSH TOKEN ON APP LOAD
        registerPushToken(token);
      } else {
        setAuthState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    } catch (err) {
      setAuthState((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  /**
   * --------------------------------------------------
   *  AUTH ACTIONS
   * --------------------------------------------------
   */
  const setAuth = async (data: {
    user: User;
    token: string;
    refreshToken: string;
  }) => {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);

    setAuthState({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding:
        data.user.roles.length > 0 &&
        data.user.industries.length > 0,
    });

    // 🔔 REGISTER PUSH TOKEN ON LOGIN
    registerPushToken(data.token);
  };

  const logout = async () => {
    await AsyncStorage.clear();
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
    setAuth,
    logout,
  };
});
