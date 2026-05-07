import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Film, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [phone, setPhone] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);

  const handleContinue = () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    if (!acceptedTerms) {
      setError('Please agree to Terms of Service and Privacy Policy');
      return;
    }
    setError('');
    setLoading(true);
    // Add a slight delay to show the loading animation for a smoother transition
    setTimeout(() => {
      router.push(`/otp?phone=${phone}`);
      setLoading(false);
    }, 500);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: '#000000' }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Film size={60} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to connect with film professionals
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            error={error}
            editable={!loading}
          />

          <Button title="Continue" onPress={handleContinue} size="large" loading={loading} />

          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAcceptedTerms((prev) => !prev)}
            activeOpacity={0.8}
          >
            {acceptedTerms ? (
              <CheckSquare size={20} color={colors.primary} />
            ) : (
              <Square size={20} color={colors.textSecondary} />
            )}
            <Text style={[styles.terms, { color: colors.textSecondary }]}>
              I agree to the{' '}
              <Text style={{ color: colors.primary }} onPress={() => Linking.openURL('https://filmyconnect24.com/terms-and-conditions')}>
                Terms and Conditions
              </Text>{' '}
              and{' '}
              <Text style={{ color: colors.primary }} onPress={() => Linking.openURL('https://filmyconnect24.com/privacy-policy')}>
                Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>
          <View style={styles.guidelinesList}>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>- no abusive content</Text>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>- no harassment</Text>
            <Text style={[styles.guidelineItem, { color: colors.textSecondary }]}>- no illegal content</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  terms: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 18,
  },
  guidelinesList: {
    marginTop: 8,
    paddingLeft: 30,
    gap: 4,
  },
  guidelineItem: {
    fontSize: 12,
    lineHeight: 16,
  },
});
