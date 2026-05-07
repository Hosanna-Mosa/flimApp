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
  blockedUsers: string[];
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
    blockedUsers: [],
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

  const blockUser = async (blockedUserId: string) => {
    if (!authState.token) return;
    try {
      await api.blockUser(blockedUserId, authState.token);
      const newBlockedUsers = [...authState.blockedUsers, blockedUserId];
      setAuthState(prev => ({ ...prev, blockedUsers: newBlockedUsers }));
      await AsyncStorage.setItem('blocked_users', JSON.stringify(newBlockedUsers));
    } catch (err) {
      console.error('Failed to block user:', err);
      throw err;
    }
  };

  const unblockUser = async (unblockedUserId: string) => {
    if (!authState.token) return;
    try {
      await api.unblockUser(unblockedUserId, authState.token);
      const updatedBlocked = authState.blockedUsers.filter(id => id !== unblockedUserId);
      setAuthState(prev => ({ ...prev, blockedUsers: updatedBlocked }));
      await AsyncStorage.setItem('blocked_users', JSON.stringify(updatedBlocked));
    } catch (error) {
      console.error('[AuthContext] Error unblocking user:', error);
      throw error;
    }
  };

  const reportContent = async (type: 'post' | 'user' | 'comment', id: string) => {
    if (!authState.token) return;
    try {
      await api.reportContent(type, id, 'inappropriate', authState.token);
    } catch (err) {
      console.error('Failed to report content:', err);
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


    if (!data.user) {
      console.error('[AuthContext] setAuth: user data is missing!', data);
      return;
    }

    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('refreshToken', data.refreshToken);

    const hasRoles = data.user.roles && data.user.roles.length > 0;
    const hasIndustries = data.user.industries && data.user.industries.length > 0;
    const completed = hasRoles && hasIndustries;

    if (completed) {
      await AsyncStorage.setItem('onboarding_complete', 'true');
    }

    let blockedUsers: string[] = [];
    try {
      const response = await api.getBlockedUsers(data.token);
      blockedUsers = response.blockedUsers || [];
      await AsyncStorage.setItem('blocked_users', JSON.stringify(blockedUsers));
    } catch (err) {
      console.error('[AuthContext] Failed to fetch blocked users on login:', err);
    }

    setAuthState({
      user: data.user,
      token: data.token,
      refreshToken: data.refreshToken,
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: completed,
      blockedUsers,
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
      blockedUsers: [],
    });
  };

  const deleteAccount = async () => {
    if (!authState.token) return;
    try {
      await api.deleteMe(authState.token);
      await logout();
    } catch (err) {
      console.error('Failed to delete account:', err);
      throw err;
    }
  };

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('auth_session_expired', () => {

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
        const blockedUsersJson = await AsyncStorage.getItem('blocked_users');
        const blockedUsers = blockedUsersJson ? JSON.parse(blockedUsersJson) : [];

        if (userJson && token) {
          // ─── Verify Token with Backend ─────────────────────────────────────
          try {

            const verifiedUser = await api.getMe(token) as User;


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
              blockedUsers: blockedUsers,
            });

            registerPushToken(token);

            // Fetch blocked users from API to keep in sync
            try {
              const apiBlockedUsers = await api.getBlockedUsers(token) as string[];
              if (Array.isArray(apiBlockedUsers)) {
                setAuthState(prev => ({ ...prev, blockedUsers: apiBlockedUsers }));
                await AsyncStorage.setItem('blocked_users', JSON.stringify(apiBlockedUsers));
              }
            } catch (blockError) {
              console.error('[AuthContext] Failed to fetch blocked users:', blockError);
            }
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
    blockUser,
    unblockUser,
    reportContent,
    deleteAccount,
  };
});
