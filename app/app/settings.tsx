import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Moon, Sun, Bell, Shield, Lock, ChevronRight, User, BadgeCheck, Info, FileText, Trash2, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import Input from '@/components/Input';
import Button from '@/components/Button';
import api from '@/utils/api';

export default function SettingsScreen() {
  console.log('SettingsScreen rendering...'); // Debug log
  const router = useRouter();
  const { colors, changeTheme, isDark } = useTheme();
  const { user, updateProfile, deleteAccount } = useAuth();
  const [isUpdatingPrivate, setIsUpdatingPrivate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const { token } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState<1 | 2>(1);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const closePasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordStep(1);
    setShowPasswordModal(false);
  };

  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    try {
      setPasswordLoading(true);
      await api.verifyPassword(currentPassword, token || undefined);
      setPasswordStep(2);
    } catch (error: any) {
      console.error('[ChangePassword] Verify error:', error);
      Alert.alert('Error', error.request || error.message || 'Incorrect password');
    } finally {
      setPasswordLoading(false);
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
      setPasswordLoading(true);
      await api.changePassword(currentPassword, newPassword, token || undefined);
      Alert.alert('Success', 'Password changed successfully');
      closePasswordModal();
    } catch (error: any) {
      console.error('[ChangePassword] Change error:', error);
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const [isTogglingPrivate, setIsTogglingPrivate] = React.useState(false);
  const togglePrivateAccount = async () => {
    if (!user || isUpdatingPrivate) return;

    setIsUpdatingPrivate(true);
    // Map between frontend isPrivate and backend accountType
    const currentAccountType = (user as any).accountType || (user.isPrivate ? 'private' : 'public');
    const newAccountType = currentAccountType === 'private' ? 'public' : 'private';

    try {
      setIsTogglingPrivate(true);
      await updateProfile({ accountType: newAccountType });
    } catch (error) {
      console.error('Failed to update account type:', error);
    } finally {
      setIsUpdatingPrivate(false);
    }
  };

  const [isUpdatingPush, setIsUpdatingPush] = useState(false);
  const togglePushSetting = async (key: 'pushLikes' | 'pushComments' | 'pushFollows' | 'pushMessages' | 'pushBoosts') => {
    if (!user || isUpdatingPush) return;
    setIsUpdatingPush(true);
    try {
      const currentVal = (user as any).privacy?.[key] !== false;
      const updatedPrivacy = {
        ...(user as any).privacy,
        [key]: !currentVal,
      };
      await updateProfile({ privacy: updatedPrivacy } as any);
    } catch (error) {
      console.error(`Failed to update push setting ${key}:`, error);
    } finally {
      setIsUpdatingPush(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Confirm Deletion",
      "Are you absolutely sure you want to delete your account? This action is permanent and cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete Account", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeleting(true);
              await deleteAccount();
              // After account is deleted, AuthContext handles state cleanup
              // and the app will automatically redirect to the login/signup flow
              // because isAuthenticated will become false.
              router.replace('/auth/signup'); 
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to delete account");
            } finally {
              setIsDeleting(false);
              setShowDeleteModal(false);
            }
          }
        }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Settings',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Appearance
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              {isDark ? (
                <Moon size={24} color={colors.primary} />
              ) : (
                <Sun size={24} color={colors.primary} />
              )}
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Dark Mode
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isDark ? 'Enabled' : 'Disabled'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                { backgroundColor: isDark ? colors.primary : colors.surface },
              ]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => changeTheme(isDark ? 'light' : 'dark')}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: isDark ? '#000000' : colors.border },
                  isDark && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
        </View>



        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Notifications
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setShowNotificationsModal(true)}
          >
            <View style={styles.settingInfo}>
              <Bell size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Notification Settings
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Configure likes, comments, messages, and system pushes
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/personal-details')}
          >
            <View style={styles.settingInfo}>
              <User size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Personal Details
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Edit email, phone, location, and more
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {Platform.OS !== 'ios' && (
            <TouchableOpacity
              style={[
                styles.settingItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push('/verification')}
            >
              <View style={styles.settingInfo}>
                <BadgeCheck size={24} color={colors.primary} />
                <View style={styles.settingText}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>
                    Verification
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {user?.verificationStatus === 'active'
                      ? `Active until ${new Date(user.verifiedUntil!).toLocaleDateString()}`
                      : 'Apply for a verified badge'
                    }
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/support')}
          >
            <View style={styles.settingInfo}>
              <Info size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Support
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Contact support for help
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Privacy & Security
          </Text>

          <View
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.settingInfo}>
              <Shield size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Private Account
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {((user as any)?.accountType === 'private' || user?.isPrivate)
                    ? 'Only approved followers can see your posts'
                    : 'Anyone can see your posts'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: ((user as any)?.accountType === 'private' || user?.isPrivate)
                    ? colors.primary
                    : colors.surface,
                },
                isTogglingPrivate && { opacity: 0.5 }
              ]}
              onPress={togglePrivateAccount}
              disabled={isUpdatingPrivate}
            >
              {isUpdatingPrivate ? (
                <ActivityIndicator size="small" color={((user as any)?.accountType === 'private' || user?.isPrivate) ? '#000000' : colors.primary} />
              ) : (
                <View
                  style={[
                    styles.toggleThumb,
                    {
                      backgroundColor: ((user as any)?.accountType === 'private' || user?.isPrivate)
                        ? '#000000'
                        : colors.border,
                    },
                    ((user as any)?.accountType === 'private' || user?.isPrivate) && styles.toggleThumbActive,
                  ]}
                />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingInfo}>
              <Lock size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Change Password
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Update your account password
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Legal
          </Text>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => Linking.openURL('https://filmyconnect24.com/privacy-policy')}
          >
            <View style={styles.settingInfo}>
              <Shield size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Privacy Policy
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => router.push('/terms-and-conditions')}
          >
            <View style={styles.settingInfo}>
              <FileText size={24} color={colors.textSecondary} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>
                  Terms and Conditions
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.settingItem,
              { backgroundColor: colors.card, borderColor: colors.error || '#ff4444' },
            ]}
            onPress={() => setShowDeleteModal(true)}
          >
            <View style={styles.settingInfo}>
              <Trash2 size={24} color={colors.error || '#ff4444'} />
              <View style={styles.settingText}>
                <Text style={[styles.settingLabel, { color: colors.error || '#ff4444' }]}>
                  Delete My Account
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <AlertTriangle size={48} color="#ff4444" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Delete Account?
                </Text>
              </View>
              
              <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                You want to delete your account? If you delete, all your data will be permanently deleted. This includes your profile, posts, messages, and followers.
              </Text>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.surface }]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: colors.text }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#ff4444' }]}
                  onPress={handleDeleteAccount}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                      Delete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showNotificationsModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNotificationsModal(false)}
        >
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={() => setShowNotificationsModal(false)}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={[styles.bottomSheetContent, { backgroundColor: colors.card }]}
            >
              <View style={styles.bottomSheetHeader}>
                <View style={[styles.bottomSheetDragHandle, { backgroundColor: colors.border }]} />
                <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
                  Notification Settings
                </Text>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.bottomSheetScrollContent}>
                {/* Likes Toggle */}
                <View
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Bell size={24} color={colors.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Likes
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Notify when someone likes your post
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: ((user as any)?.privacy?.pushLikes !== false) ? colors.primary : colors.surface },
                      isUpdatingPush && { opacity: 0.5 }
                    ]}
                    disabled={isUpdatingPush}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => togglePushSetting('pushLikes')}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: ((user as any)?.privacy?.pushLikes !== false) ? '#000000' : colors.border },
                        ((user as any)?.privacy?.pushLikes !== false) && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Comments Toggle */}
                <View
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Bell size={24} color={colors.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Comments & Replies
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Notify when someone comments on your post
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: ((user as any)?.privacy?.pushComments !== false) ? colors.primary : colors.surface },
                      isUpdatingPush && { opacity: 0.5 }
                    ]}
                    disabled={isUpdatingPush}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => togglePushSetting('pushComments')}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: ((user as any)?.privacy?.pushComments !== false) ? '#000000' : colors.border },
                        ((user as any)?.privacy?.pushComments !== false) && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Follows Toggle */}
                <View
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Bell size={24} color={colors.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Follows & Network
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Notify when someone follows or requests to follow
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: ((user as any)?.privacy?.pushFollows !== false) ? colors.primary : colors.surface },
                      isUpdatingPush && { opacity: 0.5 }
                    ]}
                    disabled={isUpdatingPush}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => togglePushSetting('pushFollows')}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: ((user as any)?.privacy?.pushFollows !== false) ? '#000000' : colors.border },
                        ((user as any)?.privacy?.pushFollows !== false) && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Messages Toggle */}
                <View
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Bell size={24} color={colors.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Direct Messages
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Notify when you receive a message
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: ((user as any)?.privacy?.pushMessages !== false) ? colors.primary : colors.surface },
                      isUpdatingPush && { opacity: 0.5 }
                    ]}
                    disabled={isUpdatingPush}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => togglePushSetting('pushMessages')}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: ((user as any)?.privacy?.pushMessages !== false) ? '#000000' : colors.border },
                        ((user as any)?.privacy?.pushMessages !== false) && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>

                {/* Boosts Toggle */}
                <View
                  style={[
                    styles.settingItem,
                    { backgroundColor: colors.card, borderColor: colors.border, marginTop: 8 },
                  ]}
                >
                  <View style={styles.settingInfo}>
                    <Bell size={24} color={colors.textSecondary} />
                    <View style={styles.settingText}>
                      <Text style={[styles.settingLabel, { color: colors.text }]}>
                        Boosts & Account Status
                      </Text>
                      <Text
                        style={[
                          styles.settingDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Notify when your profile boost ends or status changes
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.toggle,
                      { backgroundColor: ((user as any)?.privacy?.pushBoosts !== false) ? colors.primary : colors.surface },
                      isUpdatingPush && { opacity: 0.5 }
                    ]}
                    disabled={isUpdatingPush}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={() => togglePushSetting('pushBoosts')}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        { backgroundColor: ((user as any)?.privacy?.pushBoosts !== false) ? '#000000' : colors.border },
                        ((user as any)?.privacy?.pushBoosts !== false) && styles.toggleThumbActive,
                      ]}
                    />
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.bottomSheetCloseButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowNotificationsModal(false)}
              >
                <Text style={styles.bottomSheetCloseButtonText}>Done</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showPasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closePasswordModal}
        >
          <TouchableOpacity
            style={styles.bottomSheetOverlay}
            activeOpacity={1}
            onPress={closePasswordModal}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%' }}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={[styles.bottomSheetContent, { backgroundColor: colors.card }]}
              >
                <View style={styles.bottomSheetHeader}>
                  <View style={[styles.bottomSheetDragHandle, { backgroundColor: colors.border }]} />
                  <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>
                    Change Password
                  </Text>
                </View>

                <View style={{ paddingBottom: 20 }}>
                  {passwordStep === 1 ? (
                    <>
                      <Text style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', color: colors.textSecondary, marginBottom: 16 }}>
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
                        onPress={handleVerifyPassword}
                        loading={passwordLoading}
                        style={{ marginTop: 16 }}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={{ fontSize: 14, lineHeight: 20, textAlign: 'center', color: colors.textSecondary, marginBottom: 16 }}>
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
                        containerStyle={{ marginTop: 12 }}
                      />

                      <Button
                        title="Change Password"
                        onPress={handleChangePassword}
                        loading={passwordLoading}
                        style={{ marginTop: 20 }}
                      />
                    </>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.bottomSheetCloseButton, { backgroundColor: colors.surface, marginTop: 8 }]}
                  onPress={closePasswordModal}
                >
                  <Text style={[styles.bottomSheetCloseButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </TouchableOpacity>
        </Modal>

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  toggle: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  modalDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    maxHeight: '80%',
  },
  bottomSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  bottomSheetScrollContent: {
    paddingBottom: 20,
  },
  bottomSheetCloseButton: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomSheetCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
});
