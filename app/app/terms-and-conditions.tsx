import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

const TERMS_URL = 'https://filmyconnect24.com/terms-and-conditions';

export default function TermsAndConditionsScreen() {
  const { colors } = useTheme();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Terms and Conditions',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Terms and Conditions</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>Last updated: 10-02-2026</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          By using our website or application, you agree to the following terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>1. Acceptance of Terms</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          By accessing the platform, you agree to comply with these Terms and all applicable laws.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>2. Account Registration</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Users must provide accurate information. You are responsible for keeping your login credentials secure.
        </Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          OTP authentication is used to verify identity. Misuse of OTP systems is strictly prohibited.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>3. Permitted Use</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>You agree not to:</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Use the platform for illegal purposes</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Attempt unauthorized access</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Send spam or fraudulent content</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Interfere with system security</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>4. Service Availability</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          We aim to provide uninterrupted service but do not guarantee availability at all times.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>5. Data and Privacy</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Your use of the platform is governed by our Privacy Policy. By using the service, you consent to data handling described there.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>6. Limitation of Liability</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          FILMY CONNECT PRIVATE LIMITED is not liable for:
        </Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Service interruptions</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- Data loss outside our control</Text>
        <Text style={[styles.bullet, { color: colors.textSecondary }]}>- User misuse of the platform</Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>7. Termination</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          We may suspend or terminate accounts that violate these terms.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>8. Changes to Terms</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          We may update these Terms at any time. Continued use means acceptance of changes.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>9. Governing Law</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          These Terms are governed by the laws of India.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>10. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>FILMY CONNECT PRIVATE LIMITED</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>Email: Filmyconnectpvt2@gmail.com</Text>

        <TouchableOpacity
          style={[styles.websiteButton, { borderColor: colors.primary }]}
          onPress={() => Linking.openURL(TERMS_URL)}
        >
          <Text style={[styles.websiteButtonText, { color: colors.primary }]}>Open full Terms on website</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  meta: {
    fontSize: 12,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  bullet: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 4,
  },
  websiteButton: {
    marginTop: 18,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  websiteButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

