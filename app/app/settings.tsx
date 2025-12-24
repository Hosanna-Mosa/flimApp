import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import { Moon, Sun, Bell, Shield } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const { colors, changeTheme, isDark } = useTheme();
  const { user, updateProfile } = useAuth();

  const togglePrivateAccount = () => {
    updateProfile({ isPrivate: !user?.isPrivate });
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
                  {user?.isPrivate
                    ? 'Only followers can see your posts'
                    : 'Anyone can see your posts'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.toggle,
                {
                  backgroundColor: user?.isPrivate
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
                    backgroundColor: user?.isPrivate
                      ? '#000000'
                      : colors.border,
                  },
                  user?.isPrivate && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>
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
