import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

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

  const [loading, setLoading] = useState(false);

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

    setError('');
    setLoading(true);

    try {
      // Check uniqueness first - check email, phone, and password
      const check = await api.checkAvailability({ username, email, phone, password });
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
      await api.login(phone);

      router.push({
        pathname: '/auth/otp',
        params: { name, username, email, phone, password, isSignup: 'true' },
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
          <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name"
            placeholder="John Doe"
            value={name}
            onChangeText={setName}
          />

          <Input
            label="Username"
            placeholder="johndoe"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Input
            label="Email"
            placeholder="john@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Phone Number"
            placeholder="+91 98765 43210"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Input
            label="Password"
            placeholder="Create a password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Input
            label="Confirm Password"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={error}
          />

          <Button
            title="Next"
            onPress={handleNext}
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
});
