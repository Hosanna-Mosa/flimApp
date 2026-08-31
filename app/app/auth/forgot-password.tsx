import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthHeader from '@/components/auth/AuthHeader';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { api } from '@/utils/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      Alert.alert('Success', 'OTP sent to your email');
      router.push({
        pathname: '/auth/reset-password',
        params: { email }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen>
      <AuthHeader
        onBack={() => router.back()}
        title="Forgot Password"
        subtitle="Enter your email to receive a password reset OTP."
      />

      <View style={{ gap: 16 }}>
        <Input
          label="Email Address"
          placeholder="john@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
          editable={!loading}
        />

        <Button
          title="Send OTP"
          onPress={handleSendOtp}
          loading={loading}
          size="large"
          style={{ marginTop: 24 }}
        />
      </View>
    </AuthScreen>
  );
}
