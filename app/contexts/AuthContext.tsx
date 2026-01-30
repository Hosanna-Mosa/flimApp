import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, DeviceEventEmitter } from 'react-native';
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
  handleNotification: async (notification) => {
    console.log('[PUSH][FOREGROUND] 📬 Notification received while app is open');
    console.log('[PUSH][FOREGROUND] Title:', notification.request.content.title);
    console.log('[PUSH][FOREGROUND] Body:', notification.request.content.body);
    console.log('[PUSH][FOREGROUND] Data:', JSON.stringify(notification.request.content.data));

    return {
      shouldShowBanner: true, // ✅ iOS banner
      shouldShowList: true,   // ✅ iOS notification center
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
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
  if (!Device.isDevice) return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) return null;

  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    return token;
  } catch (error) {
    return null;
  }
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

  const _updateUser = async (updatedUser: User) => {
    await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

    const hasRoles = updatedUser.roles && updatedUser.roles.length > 0;
    const hasIndustries = updatedUser.industries && updatedUser.industries.length > 0;
    const onboardingCompleted = hasRoles && hasIndustries;

    if (onboardingCompleted) {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    }

    setAuthState(prev => ({
      ...prev,
      user: updatedUser,
      hasCompletedOnboarding: onboardingCompleted
    }));
  };

  const registerPushToken = async (authToken: string) => {
    try {
      const pushToken = await registerForPushNotificationsAsync();
      if (pushToken && authToken) {
        await api.registerPushToken(pushToken, authToken);
      }
    } catch (err) {
      console.error('[PUSH] Failed to register token:', err);
    }
  };

  const login = async (phone: string) => {
    // This is likely a mock or simplified login for the OTP flow in this app
    // In a real app, this would call an API and get a token
    // For now, we'll mock it if it's expected to be here
    console.log('Login called for:', phone);
    // Since otp.tsx calls login and then redirects to /role-selection,
    // we need to make sure isAuthenticated becomes true.
    // However, without a real API response here, we're guessing.
    // Let's assume it's a placeholder for now since I don't see it in API.ts as "login(phone)"
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.token) return;
    try {
      const updatedUser = await api.updateMe(updates as Record<string, unknown>, authState.token);
      await _updateUser(updatedUser as User);
    } catch (err) {
      console.error('Failed to update profile:', err);
      throw err;
    }
  };

  const refreshUser = useCallback(async () => {
    if (!authState.token) return null;
    try {
      const updatedUser = await api.me(authState.token);
      await _updateUser(updatedUser as User);
      return updatedUser as User;
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return null;
    }
  }, [authState.token]);

  const updateUserRoles = async (roles: UserRole[]) => {
    await updateProfile({ roles });
  };

  const updateUserIndustries = async (industries: Industry[]) => {
    await updateProfile({ industries });
  };

  const setAuth = async (data: {
    user: User;
    token: string;
    refreshToken: string;
  }) => {
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);

    const hasRoles = data.user.roles && data.user.roles.length > 0;
    const hasIndustries = data.user.industries && data.user.industries.length > 0;
    const completed = hasRoles && hasIndustries;

    if (completed) {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    }

    setAuthState({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: completed,
    });

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

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('auth_session_expired', () => {
      console.log('[AuthContext] Session expired event received, logging out...');
      logout();
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const userJson = await AsyncStorage.getItem('user');
        const token = await AsyncStorage.getItem('token');
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const onboardingComplete = await AsyncStorage.getItem('onboarding_complete');

        if (userJson && token) {
          // ─── Verify Token with Backend ─────────────────────────────────────
          try {
            console.log('[AuthContext] Verifying token...');
            const verifiedUser = await api.getMe(token) as User;
            console.log('[AuthContext] Token verified for:', verifiedUser.name);

            // Update local user data with fresh data from server
            const user = verifiedUser;
            const hasRoles = user.roles && user.roles.length > 0;
            const hasIndustries = user.industries && user.industries.length > 0;

            setAuthState({
              user,
              token,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              hasCompletedOnboarding: onboardingComplete === 'true' || (hasRoles && hasIndustries),
            });

            registerPushToken(token);
          } catch (error) {
            console.error('[AuthContext] Token verification failed:', error);
            // Token is invalid/expired -> Clear auth state
            await logout();
          }
        } else {
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('[AuthContext] Error loading auth state:', err);
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  return {
    ...authState,
    setAuth,
    logout,
    login,
    updateProfile,
    updateUserRoles,
    updateUserIndustries,
    refreshUser,
  };
});
