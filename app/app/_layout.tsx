import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, router } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform, Linking, Modal, View, Text, StyleSheet, TouchableOpacity, DeviceEventEmitter } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import { api } from '@/utils/api';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import {
  getNotificationRoute,
  setPendingNotificationRoute,
  wasResponseHandled,
  markResponseHandled,
} from '@/utils/notificationRouting';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { MediaProvider } from '@/contexts/MediaContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ShareIntentProvider } from 'expo-share-intent';
import { useScreenTracking } from '@/hooks/useScreenTracking';
import { useIncomingShare } from '@/hooks/useIncomingShare';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  useScreenTracking();
  // Content shared into the app from another app's share sheet.
  useIncomingShare();

  // Push-notification taps → deep link. Hot start (app open/backgrounded)
  // navigates immediately once the user is authenticated; cold start parks the
  // route until the splash screen has redirected to /home (see index.tsx).
  useEffect(() => {
    const openFromNotification = async (response: Notifications.NotificationResponse | null, coldStart: boolean) => {
      if (!response) return;
      const identifier = response.notification.request.identifier;
      if (await wasResponseHandled(identifier)) return;
      const route = getNotificationRoute(response.notification.request.content.data as Record<string, any>);
      if (!route) return;
      await markResponseHandled(identifier);

      if (coldStart || isLoading || !isAuthenticated) {
        setPendingNotificationRoute(route);
        return;
      }
      router.push(route as any);
    };

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      openFromNotification(response, false).catch((err) =>
        console.error('[PushNotification] Error handling click interaction:', err)
      );
    });

    Notifications.getLastNotificationResponseAsync()
      .then((response) => openFromNotification(response, true))
      .catch((err) => console.error('[PushNotification] Error checking cold start notification:', err));

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, isLoading]);

  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        // Themed defaults so individual screens don't have to repeat
        // headerStyle/headerTintColor in their own Stack.Screen options.
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="messages" options={{ title: 'Messages' }} />
      <Stack.Screen name="chat" options={{ title: 'Chat' }} />
      <Stack.Screen name="share" options={{ title: 'Share to' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="trending" options={{ title: 'Trending' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Geometric415Black': require('../assets/fonts/Geometric415BlackBT.ttf'),
  });

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    forceUpdate: boolean;
    storeUrl: string;
    title: string;
    message: string;
    latestVersion: string;
  } | null>(null);

  const [showShutdownModal, setShowShutdownModal] = useState(false);
  const [shutdownInfo, setShutdownInfo] = useState<{
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('app_shutdown', (data) => {
      setShutdownInfo({
        title: data.title || 'Currently App is Shut Down',
        message: data.message || 'We are fixing a big bug, so we want to suddenly shut down the application.',
      });
      setShowShutdownModal(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const platform = Platform.OS;
        if (platform !== 'ios' && platform !== 'android') return;
        
        const localVersion = Constants.expoConfig?.version || '1.0.0';
        const response = await api.checkVersion(platform, localVersion);
        
        if (response.isShutdown) {
          setShutdownInfo({
            title: response.shutdownTitle || 'Currently App is Shut Down',
            message: response.shutdownMessage || 'We are fixing a big bug, so we want to suddenly shut down the application.',
          });
          setShowShutdownModal(true);
          return;
        }

        if (response.updateRequired) {
          if (!response.forceUpdate) {
            const dismissedVersion = await AsyncStorage.getItem('@last_dismissed_update_version');
            if (dismissedVersion === response.latestVersion) {
              return;
            }
          }

          setUpdateInfo({
            forceUpdate: response.forceUpdate,
            storeUrl: response.storeUrl,
            title: response.title,
            message: response.message,
            latestVersion: response.latestVersion,
          });
          setShowUpdateModal(true);
        }
      } catch (err) {
        console.error('[VersionCheck] Failed:', err);
      }
    };

    if (loaded) {
      checkVersion();
    }
  }, [loaded]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync('#000000');
    const setNavBar = async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional native module, loaded lazily
        const NavigationBar = require('expo-navigation-bar');
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light');
      } catch {
        // Ignore if module not found or platform issue
      }
    };
    setNavBar();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <NotificationProvider>
              <MessageProvider>
                <MediaProvider>
                  <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
                    <StatusBar style="light" backgroundColor="#000000" />
                    {/* resetOnBackground is off: a share arriving as the app
                        launches passes through inactive states, and clearing on
                        those throws the intent away before anything has read
                        it. useIncomingShare clears it once it has a copy. */}
                    <ShareIntentProvider options={{ resetOnBackground: false }}>
                      <RootLayoutNav />
                    </ShareIntentProvider>
                    
                    {updateInfo && (
                      <Modal
                        visible={showUpdateModal}
                        transparent
                        animationType="fade"
                        onRequestClose={() => {
                          if (!updateInfo.forceUpdate) {
                            setShowUpdateModal(false);
                          }
                        }}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>{updateInfo.title}</Text>
                            <Text style={styles.modalMessage}>{updateInfo.message}</Text>
                            
                            <TouchableOpacity
                              style={styles.updateButton}
                              onPress={() => Linking.openURL(updateInfo.storeUrl)}
                            >
                              <Text style={styles.updateButtonText}>Update Now</Text>
                            </TouchableOpacity>
                            
                            {!updateInfo.forceUpdate && (
                              <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={async () => {
                                  try {
                                    await AsyncStorage.setItem(
                                      '@last_dismissed_update_version',
                                      updateInfo.latestVersion
                                    );
                                  } catch (err) {
                                    console.error('[VersionCheck] Save dismiss failed:', err);
                                  }
                                  setShowUpdateModal(false);
                                }}
                              >
                                <Text style={styles.cancelButtonText}>Not Now</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </Modal>
                    )}

                    {shutdownInfo && (
                      <Modal
                        visible={showShutdownModal}
                        transparent
                        animationType="fade"
                        onRequestClose={() => {}}
                      >
                        <View style={styles.modalOverlay}>
                          <View style={[styles.modalContent, { borderColor: '#FF4D4D', borderWidth: 1.5 }]}>
                            <Text style={[styles.modalTitle, { color: '#FF4D4D', fontWeight: '700' }]}>{shutdownInfo.title}</Text>
                            <Text style={styles.modalMessage}>{shutdownInfo.message}</Text>
                          </View>
                        </View>
                      </Modal>
                    )}
                  </GestureHandlerRootView>
                </MediaProvider>
              </MessageProvider>
            </NotificationProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#AAAAAA',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  updateButton: {
    backgroundColor: '#0095F6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
});
