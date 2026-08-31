import React, { useEffect, useMemo } from 'react';
import { Text, Animated, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** Logo, wordmark and tagline that fade + spring in on the splash screen. */
export default function SplashContent() {
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

  return (
    <Animated.View
      style={[
        styles.content,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Animated.Image source={require('../../assets/images/logo.png')} style={styles.logo} />

      <Text style={[styles.wordmark, { color: colors.text }]}>FILMYCONNECT</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>24 CRAFTS</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  wordmark: {
    fontFamily: 'Geometric415Black',
    fontSize: 32,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});
