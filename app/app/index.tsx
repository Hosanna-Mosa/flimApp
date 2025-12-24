import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Film } from 'lucide-react-native';
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
        <Film size={80} color={colors.primary} strokeWidth={1.5} />
        <Text style={[styles.title, { color: colors.text }]}>FilmConnect</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Where Cinema Meets Community
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
