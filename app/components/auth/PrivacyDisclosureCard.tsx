import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';

const PRIVACY_URL = 'https://filmyconnect24.com/privacy-policy';

/** "What data we collect" disclosure shown above the Sign Up terms checkbox. */
export default function PrivacyDisclosureCard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <AppText variant="bodySemibold" secondary style={styles.title}>
        📋 What data we collect
      </AppText>
      <AppText variant="caption" secondary style={styles.text}>
        FilmyConnect collects your name, phone number, email, profile media (photos/videos), and location to provide networking and collaboration services. Push notifications alert you about messages, likes, and updates. Your data is never shared with third parties for marketing. See our{' '}
        <Text style={{ color: colors.primary }} onPress={() => Linking.openURL(PRIVACY_URL)}>
          Privacy Policy
        </Text>{' '}
        for full details.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 4,
  },
  title: {
    marginBottom: 6,
  },
  text: {
    lineHeight: 18,
  },
});
