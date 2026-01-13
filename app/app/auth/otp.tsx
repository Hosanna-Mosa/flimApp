import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { apiVerifyOtp } from '@/utils/api';

export default function OtpScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setAuth } = useAuth();
  const params = useLocalSearchParams();

  const { phone, name, email, password } = params;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    if (!phone) {
       setError('Phone number invalid');
       return;
    }

    setError('');
    setLoading(true);

    try {
      const details = name && email && password ? { 
        name: name as string, 
        email: email as string, 
        password: password as string 
      } : undefined;

      const response = await apiVerifyOtp(phone as string, otp, details);
      
      setAuth({
        token: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user as any,
      });

      // Redirect based on flow
      if (params.isSignup === 'true') {
        router.replace('/auth/onboarding');
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
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
          <Text style={[styles.title, { color: colors.text }]}>Verification</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Enter the OTP sent to {phone}
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="OTP Code"
            placeholder="123456"
            keyboardType="number-pad"
            value={otp}
            onChangeText={setOtp}
            maxLength={6}
            error={error}
          />

          <Button
            title="Verify"
            onPress={handleVerify}
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  button: {
    marginTop: 24,
  },
});
