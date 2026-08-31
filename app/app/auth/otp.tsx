import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthHeader from '@/components/auth/AuthHeader';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { api } from '@/utils/api';

export default function OtpScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const params = useLocalSearchParams();

  const { phone, name, username, email, password } = params;

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
        username: username as string,
        email: email as string,
        password: password as string
      } : undefined;

      const response = await api.verifyOtp(phone as string, otp, details);

      setAuth({
        token: (response as any).accessToken,
        refreshToken: (response as any).refreshToken,
        user: (response as any).user as any,
      });

      // Redirect based on flow
      if (params.isSignup === 'true') {
        router.replace({
          pathname: '/auth/onboarding',
          params: { name, username, email, phone, password },
        });
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
    <AuthScreen>
      <AuthHeader onBack={() => router.back()} subtitle={`Enter the OTP sent to ${phone}`} />

      <View style={{ gap: 16 }}>
        <Input
          label="OTP Code"
          placeholder="123456"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          maxLength={6}
          error={error}
          editable={!loading}
        />

        <Button
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          size="large"
          style={{ marginTop: 24 }}
        />
      </View>
    </AuthScreen>
  );
}
