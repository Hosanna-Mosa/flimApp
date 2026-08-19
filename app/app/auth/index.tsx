import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Film } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';
import AppText from '@/components/AppText';

export default function LandingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Animated.Image 
          source={require('../../assets/images/logo.png')} 
          style={{ width: 100, height: 100, resizeMode: 'contain' }} 
        />
          <AppText variant="display" weight="regular" style={[styles.title, { fontFamily: 'Geometric415Black', textTransform: 'uppercase' }]}>
            FILMYCONNECT
          </AppText>
          <AppText variant="h5" secondary align="center">
            24 CRAFTS
          </AppText>
        </View>

        <View style={styles.actions}>
          <Button
            title="Sign In"
            onPress={() => router.push('/auth/signin')}
            size="large"
            variant="primary"
          />
          <Button
            title="Sign Up"
            onPress={() => router.push('/auth/signup')}
            size="large"
            variant="outline"
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
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
  title: {},
  actions: {
    gap: 16,
    width: '100%',
  },
});
