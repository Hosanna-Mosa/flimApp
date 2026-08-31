import React, { useEffect, useMemo } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';
import Button from '@/components/Button';

interface LandingContentProps {
  onSignIn: () => void;
  onSignUp: () => void;
}

/** Fade-in logo, wordmark and tagline with the Sign In / Sign Up buttons. */
export default function LandingContent({ onSignIn, onSignUp }: LandingContentProps) {
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
      <View style={styles.header}>
        <Animated.Image source={require('../../assets/images/logo.png')} style={styles.logo} />
        <AppText variant="display" weight="regular" style={styles.wordmark}>
          FILMYCONNECT
        </AppText>
        <AppText variant="h5" secondary align="center">
          24 CRAFTS
        </AppText>
      </View>

      <View style={styles.actions}>
        <Button title="Sign In" onPress={onSignIn} size="large" variant="primary" />
        <Button title="Sign Up" onPress={onSignUp} size="large" variant="outline" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 60,
  },
  header: {
    alignItems: 'center',
    gap: 16,
    marginTop: 60,
  },
  logo: { width: 100, height: 100, resizeMode: 'contain' },
  wordmark: {
    fontFamily: 'Geometric415Black',
    textTransform: 'uppercase',
  },
  actions: {
    gap: 16,
    width: '100%',
  },
});
