import React, { useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import AuthScreen from '@/components/auth/AuthScreen';
import AuthHeader from '@/components/auth/AuthHeader';
import PrivacyDisclosureCard from '@/components/auth/PrivacyDisclosureCard';
import TermsCheckbox from '@/components/auth/TermsCheckbox';
import CommunityGuidelinesList from '@/components/auth/CommunityGuidelinesList';
import Input from '@/components/Input';
import PhoneInput from '@/components/PhoneInput';
import Button from '@/components/Button';
import { api } from '@/utils/api';
import { Country } from '@/utils/country';
import {
  formatAlreadyRegisteredMessage,
  formatConflictMessage,
  formatSingleFieldMessage,
} from '@/utils/authErrors';

export default function SignUpScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [countryCode, setCountryCode] = useState('IN');
  const [callingCode, setCallingCode] = useState('91');

  const [loading, setLoading] = useState(false);

  const onSelect = (country: Country) => {
    setCountryCode(country.code);
    setCallingCode(country.callingCode.replace('+', ''));
  };

  const handleNext = async () => {
    if (!name || !username || !email || !phone || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!acceptedTerms) {
      setError('Please agree to Terms of Service and Privacy Policy');
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
      // Check uniqueness first - check email, phone, and password
      const check = await api.checkAvailability({
        username,
        email,
        phone: normalizedPhone,
        password
      });
      if (!check.available) {
        // Handle multiple conflicting fields
        if (check.fields && Array.isArray(check.fields)) {
          setError(formatAlreadyRegisteredMessage(check.fields));
        } else if (check.field) {
          // Legacy single field response
          setError(formatSingleFieldMessage(check.field));
        } else {
          setError(check.message || 'One or more fields are already registered.');
        }
        setLoading(false);
        return;
      }

      // Send OTP first
      await api.login(normalizedPhone);

      router.push({
        pathname: '/auth/otp',
        params: { name, username, email, phone: normalizedPhone, password, isSignup: 'true' },
      });
    } catch (err: any) {
      // Handle registration errors with conflicts
      if (err.conflicts && Array.isArray(err.conflicts)) {
        setError(formatConflictMessage(err.conflicts));
      } else {
        setError(err.message || 'Failed to send OTP. Please check phone number.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen bottomPadding={40}>
      <AuthHeader onBack={() => router.back()} />

      <View>
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />

        <Input
          label="Username"
          placeholder="johndoe"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />

        <Input
          label="Email"
          placeholder="john@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          editable={!loading}
        />

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
          placeholder="Create a password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <Input
          label="Confirm Password"
          placeholder="Confirm your password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          error={error}
          editable={!loading}
        />

        <PrivacyDisclosureCard />
        <TermsCheckbox checked={acceptedTerms} onToggle={() => setAcceptedTerms((prev) => !prev)} />
        <CommunityGuidelinesList />

        <Button
          title="Next"
          onPress={handleNext}
          size="large"
          loading={loading}
          disabled={!acceptedTerms || loading}
          style={{ marginTop: 12 }}
        />
      </View>
    </AuthScreen>
  );
}
