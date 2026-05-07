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
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import PhoneInput from '@/components/PhoneInput';
import Button from '@/components/Button';
import api from '@/utils/api';
import { Country } from '@/utils/country';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export default function SignUpScreen() {
  const router = useRouter();
  const { colors } = useTheme();

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
  const [pickerVisible, setPickerVisible] = useState(false);

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
          const fieldLabels: Record<string, string> = {
            email: 'Email',
            phone: 'Phone number',
            password: 'Password',
            username: 'Username'
          };
          const conflictMessages = check.fields.map((field: string) => fieldLabels[field] || field);
          setError(`The following ${conflictMessages.length === 1 ? 'field is' : 'fields are'} already registered: ${conflictMessages.join(', ')}`);
        } else if (check.field) {
          // Legacy single field response
          const fieldLabels: Record<string, string> = {
            email: 'Email',
            phone: 'Phone number',
            password: 'Password',
            username: 'Username'
          };
          setError(`This ${fieldLabels[check.field] || check.field} is already registered.`);
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
        const fieldLabels: Record<string, string> = {
          email: 'Email',
          phone: 'Phone number',
          password: 'Password',
          username: 'Username'
        };
        const conflictMessages = err.conflicts.map((field: string) => fieldLabels[field] || field);
        setError(`Registration failed. The following ${conflictMessages.length === 1 ? 'field is' : 'fields are'} already registered: ${conflictMessages.join(', ')}`);
      } else {
        setError(err.message || 'Failed to send OTP. Please check phone number.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: '#000000' }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Geometric415Black', textTransform: 'uppercase' }]}>
            FILMYCONNECT
          </Text>
        </View>

        <View style={styles.form}>
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
          // PhoneInput might not support editable directly, but let's assume it doesn't need it for now or check it
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
            <Text style={[styles.termsText, { color: colors.textSecondary }]}>
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

          <Button
            title="Next"
            onPress={handleNext}
            size="large"
            loading={loading}
            disabled={!acceptedTerms || loading}
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
    paddingBottom: 40,
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
  },
  form: {
  },
  button: {
    marginTop: 12,
  },
  termsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  guidelinesList: {
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 30,
    gap: 4,
  },
  guidelineItem: {
    fontSize: 12,
    lineHeight: 16,
  },
  countryPickerWrapper: {
    paddingLeft: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#333',
    marginRight: 8,
  },
  countryPickerButton: {
    marginTop: 0,
  },
});
