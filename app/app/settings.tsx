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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Moon, Sun, Bell, Shield, Lock, ChevronRight, User, BadgeCheck, Info, FileText, Trash2, AlertTriangle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  console.log('SettingsScreen rendering...'); // Debug log
  const router = useRouter();
  const { colors, changeTheme, isDark } = useTheme();
  const { user, updateProfile, deleteAccount } = useAuth();
  const [isUpdatingPrivate, setIsUpdatingPrivate] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
                  Push Notifications
                </Text>
                <Text
                  style={[
                    styles.settingDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Receive notifications for messages and updates
                </Text>
              </View>
            </View>
          </View>
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
            onPress={() => router.push('/change-password')}
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
});
