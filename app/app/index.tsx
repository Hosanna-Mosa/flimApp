import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SplashContent from '@/components/auth/SplashContent';
import { useSplashRedirect } from '@/hooks/useSplashRedirect';

export default function SplashScreen() {
  const { colors } = useTheme();
  useSplashRedirect();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <SplashContent />
    </View>
  );
}
