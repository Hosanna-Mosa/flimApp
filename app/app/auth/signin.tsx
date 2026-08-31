import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { useAuth } from '@/contexts/AuthContext';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthHeader from '@/components/auth/AuthHeader';
import Input from '@/components/Input';
import PhoneInput from '@/components/PhoneInput';
import Button from '@/components/Button';
import TextLink from '@/components/ui/TextLink';
import { api } from '@/utils/api';
import { Country } from '@/utils/country';

export default function SignInScreen() {
  const router = useRouter();
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
    <AuthScreen>
      <AuthHeader onBack={() => router.back()} />

      <View style={{ gap: 16 }}>
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
          editable={!loading}
        />

        <TextLink
          label="Forgot Password?"
          onPress={() => router.push('/auth/forgot-password')}
          align="end"
          style={{ marginTop: 8 }}
        />

        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={loading}
          size="large"
          style={{ marginTop: 24 }}
        />
      </View>
    </AuthScreen>
  );
}
