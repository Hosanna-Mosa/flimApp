import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SystemUI from 'expo-system-ui';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MessageProvider } from '@/contexts/MessageContext';
import { MediaProvider } from '@/contexts/MediaContext';
import { Audio } from 'expo-av';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: '#000000' }
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="otp" options={{ headerShown: false }} />
      <Stack.Screen name="role-selection" options={{ headerShown: false }} />
      <Stack.Screen
        name="industry-selection"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="messages" options={{ title: 'Messages' }} />
      <Stack.Screen name="chat" options={{ title: 'Chat' }} />
      <Stack.Screen name="post" options={{ title: 'Post' }} />
      <Stack.Screen name="user" options={{ title: 'Profile' }} />
      <Stack.Screen name="communities" options={{ title: 'Communities' }} />
      <Stack.Screen name="community" options={{ title: 'Community' }} />
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
        const NavigationBar = require('expo-navigation-bar');
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light');
      } catch (e) {
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
                    <RootLayoutNav />
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
