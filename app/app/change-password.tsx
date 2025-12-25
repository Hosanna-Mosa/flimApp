import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    try {
      setLoading(true);
      await api.verifyPassword(currentPassword, token || undefined);
      setStep(2);
    } catch (error: any) {
      console.error('[ChangePassword] Verify error:', error);
      Alert.alert('Error', error.request || error.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.changePassword(currentPassword, newPassword, token || undefined);
      Alert.alert('Success', 'Password changed successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      console.error('[ChangePassword] Change error:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Change Password',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {step === 1 ? (
            <>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                To set a new password, please enter your current password first.
              </Text>
              
              <Input
                label="Current Password"
                placeholder="Enter current password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Continue"
                onPress={handleVerify}
                loading={loading}
                style={styles.button}
              />
            </>
          ) : (
            <>
              <Text style={[styles.description, { color: colors.textSecondary }]}>
                Create a new password that is at least 6 characters long.
              </Text>

              <Input
                label="New Password"
                placeholder="Enter new password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Input
                label="Confirm New Password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <Button
                title="Change Password"
                onPress={handleChangePassword}
                loading={loading}
                style={styles.button}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  button: {
    marginTop: 20,
  },
});
