import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

export type PushKey = 'pushLikes' | 'pushComments' | 'pushFollows' | 'pushMessages' | 'pushBoosts';

/**
 * All Settings-screen logic: private account, push preferences, change
 * password flow, and account deletion. The screen and its section
 * components stay presentational.
 */
export function useSettings() {
  const router = useRouter();
  const { user, token, updateProfile, deleteAccount } = useAuth();
  const u = user as any;

  // ---- Private account
  const isPrivate = u?.accountType === 'private' || !!user?.isPrivate;
  const [isUpdatingPrivate, setIsUpdatingPrivate] = useState(false);
  const togglePrivateAccount = async () => {
    if (!user || isUpdatingPrivate) return;
    setIsUpdatingPrivate(true);
    try {
      await updateProfile({ accountType: isPrivate ? 'public' : 'private' });
    } catch (error) {
      console.error('Failed to update account type:', error);
    } finally {
      setIsUpdatingPrivate(false);
    }
  };

  // ---- Push preferences (default on when unset)
  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const isPushEnabled = (key: PushKey) => u?.privacy?.[key] !== false;
  const togglePush = async (key: PushKey) => {
    if (!user || isUpdatingPush) return;
    setIsUpdatingPush(true);
    try {
      await updateProfile({ privacy: { ...u?.privacy, [key]: !isPushEnabled(key) } } as any);
    } catch (error) {
      console.error(`Failed to update push setting ${key}:`, error);
    } finally {
      setIsUpdatingPush(false);
    }
  };

  // ---- Change password (2 steps: verify current → set new)
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const resetPasswordFlow = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStep(1);
  };

  const verifyCurrentPassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    try {
      setPasswordLoading(true);
      await api.verifyPassword(currentPassword, token || undefined);
      setPasswordStep(2);
    } catch (error: any) {
      Alert.alert('Error', error.request || error.message || 'Incorrect password');
    } finally {
      setPasswordLoading(false);
    }
  };

  /** Returns true when the password was changed (caller closes the sheet). */
  const changePassword = async (): Promise<boolean> => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    try {
      setPasswordLoading(true);
      await api.changePassword(currentPassword, newPassword, token || undefined);
      Alert.alert('Success', 'Password changed successfully');
      resetPasswordFlow();
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
      return false;
    } finally {
      setPasswordLoading(false);
    }
  };

  // ---- Delete account (themed dialog → native confirm → delete)
  const [isDeleting, setIsDeleting] = useState(false);
  /**
   * Returns true when the account was deleted.
   *
   * No extra confirm here: DeleteAccountDialog already asks, and stacking a
   * native Alert on top of an open Modal is unreliable on Android (the alert
   * can land behind the modal, so nothing appears to happen).
   */
  const deleteMyAccount = async (): Promise<boolean> => {
    try {
      setIsDeleting(true);
      await deleteAccount();
      router.replace('/auth/signup');
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    user,
    isPrivate,
    isUpdatingPrivate,
    togglePrivateAccount,
    isUpdatingPush,
    isPushEnabled,
    togglePush,
    password: {
      step: passwordStep,
      current: currentPassword,
      next: newPassword,
      confirm: confirmPassword,
      loading: passwordLoading,
      setCurrent: setCurrentPassword,
      setNext: setNewPassword,
      setConfirm: setConfirmPassword,
      verifyCurrent: verifyCurrentPassword,
      change: changePassword,
      reset: resetPasswordFlow,
    },
    isDeleting,
    deleteMyAccount,
  };
}
