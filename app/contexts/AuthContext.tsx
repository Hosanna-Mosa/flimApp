import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[PUSH][INIT] 🚀 Starting push notification registration');
  console.log('[PUSH][INIT] Platform:', Platform.OS);
  console.log('[PUSH][INIT] Device.isDevice:', Device.isDevice);

  if (!Device.isDevice) {
    console.error('[PUSH][ERROR] ❌ Not a physical device - push notifications unavailable');
    return null;
  }

  console.log('[PUSH][DEVICE] ✅ Physical device detected');

  // Android channel - CRITICAL for Android 8+
  if (Platform.OS === 'android') {
    console.log('[PUSH][ANDROID] Android Version (API Level):', Platform.Version);
    
    try {
      console.log('[PUSH][CHANNEL] Creating notification channel...');
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true,
      });
      console.log('[PUSH][CHANNEL] ✅ Channel created: name=Default, importance=MAX, lockscreen=PUBLIC');
    } catch (error) {
      console.error('[PUSH][CHANNEL] ❌ Failed to create channel:', error);
      return null;
    }
    
    // Explicit Permission Request for Android 13+ (API 33+)
    if (Platform.Version >= 33) {
      console.log('[PUSH][PERMISSION] Android 13+ detected - requesting POST_NOTIFICATIONS');
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        console.log('[PUSH][PERMISSION] POST_NOTIFICATIONS result:', granted);
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.error('[PUSH][PERMISSION] ❌ POST_NOTIFICATIONS denied by user');
          return null;
        }
        console.log('[PUSH][PERMISSION] ✅ POST_NOTIFICATIONS granted');
      } catch (error) {
        console.error('[PUSH][PERMISSION] ❌ Error requesting POST_NOTIFICATIONS:', error);
        return null;
      }
    } else {
      console.log('[PUSH][PERMISSION] Android < 13 - POST_NOTIFICATIONS not required');
    }
  }

  console.log('[PUSH][PERMISSION] Checking existing notification permissions...');
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  console.log('[PUSH][PERMISSION] Existing status:', existingStatus);

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('[PUSH][PERMISSION] Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
    console.log('[PUSH][PERMISSION] New status:', finalStatus);
  }

  if (finalStatus !== 'granted') {
    console.error('[PUSH][PERMISSION] ❌ Notification permission denied - final status:', finalStatus);
    return null;
  }

  console.log('[PUSH][PERMISSION] ✅ Notification permissions granted');

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  console.log('[PUSH][TOKEN] EAS Project ID:', projectId || 'NOT SET');

  if (!projectId) {
    console.error('[PUSH][TOKEN] ❌ EAS Project ID not configured');
    return null;
  }

  try {
    console.log('[PUSH][TOKEN] Generating Expo push token...');
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('[PUSH][TOKEN] ✅ Token generated successfully');
    console.log('[PUSH][TOKEN] Token value:', token);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    return token;
  } catch (error) {
    console.error('[PUSH][TOKEN] ❌ Failed to generate token:', error);
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

  /**
   * --------------------------------------------------
   *  REGISTER PUSH TOKEN WITH BACKEND
   * --------------------------------------------------
   */
  const registerPushToken = async (authToken: string) => {
    console.log('[PUSH][BACKEND] 📤 Attempting to register token with backend...');
    try {
      const pushToken = await registerForPushNotificationsAsync();
      
      if (!pushToken) {
        console.error('[PUSH][BACKEND] ❌ No push token available - skipping backend registration');
        return;
      }
      
      if (!authToken) {
        console.error('[PUSH][BACKEND] ❌ No auth token available - skipping backend registration');
        return;
      }
      
      console.log('[PUSH][BACKEND] Sending token to backend API...');
      console.log('[PUSH][BACKEND] Token:', pushToken);
      
      await api.registerPushToken(pushToken, authToken);
      
      console.log('[PUSH][BACKEND] ✅ Token successfully registered with backend');
    } catch (err) {
      console.error('[PUSH][BACKEND] ❌ Failed to register token with backend:', err);
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
        console.log('[PUSH][LIFECYCLE] 📱 App loaded with authenticated user - registering push token');
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
    console.log('[PUSH][LIFECYCLE] 🔐 User logged in - registering push token');
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
