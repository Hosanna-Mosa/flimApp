import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Moon, Sun, Bell, Shield, Lock, ChevronRight, User, BadgeCheck, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  console.log('SettingsScreen rendering...'); // Debug log
  const router = useRouter();
  const { colors, changeTheme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const togglePrivateAccount = async () => {
    if (!user) return;

    // Map between frontend isPrivate and backend accountType
    const currentAccountType = (user as any).accountType || (user.isPrivate ? 'private' : 'public');
    const newAccountType = currentAccountType === 'private' ? 'public' : 'private';

    try {
      await updateProfile({ accountType: newAccountType });
    } catch (error) {
      console.error('Failed to update account type:', error);
    }
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
                  Apply for a verified badge
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
              ]}
              onPress={togglePrivateAccount}
            >
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
});
