import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import PhoneInput from '@/components/PhoneInput';
import Button from '@/components/Button';
import api from '@/utils/api';
import { Country } from '@/utils/country';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setAuth } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');

  const onSelect = (country: Country) => {
    setCountryCode(country.code);
    setCallingCode(country.callingCode.replace('+', ''));
  };

  const handleSignIn = async () => {
    if (!phone || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setLoading(true);

    const fullPhone = phone.startsWith('+') ? phone : `+${callingCode}${phone.replace(/^0+/, '')}`;

    if (!isValidPhoneNumber(fullPhone)) {
      setError('Please enter a valid phone number for the selected country');
      setLoading(false);
      return;
    }

    const normalizedPhone = parsePhoneNumber(fullPhone).number;

    try {
      const response = await api.loginPassword({ phone: normalizedPhone, password });
      setAuth({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user as any,
      });
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: '#000000' }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
        </View>

        <View style={styles.form}>
          <PhoneInput
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            countryCode={countryCode}
            callingCode={callingCode}
            onSelectCountry={onSelect}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            error={error}
          />

          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            style={styles.forgotPasswordContainer}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            loading={loading}
            size="large"
            style={styles.button}
          />
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
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 24,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
