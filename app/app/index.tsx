import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, hasCompletedOnboarding, isLoading } = useAuth();
  const { colors } = useTheme();
  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const scaleAnim = useMemo(() => new Animated.Value(0.8), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => {
        if (!isAuthenticated) {
          router.replace('/auth');
        } else if (!hasCompletedOnboarding) {
          router.replace('/role-selection');
        } else {
          router.replace('/home');
        }
      }, 2000);
    }
  }, [isLoading, isAuthenticated, hasCompletedOnboarding, router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.Image 
          source={require('../assets/images/logo.png')} 
          style={{ width: 100, height: 100, resizeMode: 'contain' }} 
        />
 
        <Text
                      style={{
                        fontFamily: 'Geometric415Black',
                        fontSize: 32,
                        color: colors.text,
                      }}
                    >
                      FILMYCONNECT
                    </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          24 CRAFTS
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
