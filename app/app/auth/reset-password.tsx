import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthHeader from '@/components/auth/AuthHeader';
import Input from '@/components/Input';
import Button from '@/components/Button';
import AppText from '@/components/AppText';
import { api } from '@/utils/api';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { colors } = useTheme();

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!otp || !newPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(email, otp, newPassword);
      Alert.alert('Success', 'Password reset successfully. Please login with new password.', [
        { text: 'OK', onPress: () => router.dismissAll() } // Or navigate to signin
      ]);
      router.replace('/auth/signin');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen centered>
      <AuthHeader
        title="Reset Password"
        subtitle={`Enter the OTP sent to ${email} and your new password.`}
      />

      <View style={{ gap: 16 }}>
        <Input
          label="OTP"
          placeholder="123456"
          value={otp}
          onChangeText={setOtp}
          keyboardType="number-pad"
          maxLength={6}
          editable={!loading}
        />

        <Input
          label="New Password"
          placeholder="Enter new password"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
          editable={!loading}
        />

        {!!error && <AppText variant="body" color={colors.error} align="center">{error}</AppText>}

        <Button
          title="Reset Password"
          onPress={handleReset}
          loading={loading}
          size="large"
          style={{ marginTop: 24 }}
        />
      </View>
    </AuthScreen>
  );
}
