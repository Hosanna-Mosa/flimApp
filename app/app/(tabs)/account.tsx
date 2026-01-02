import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import {
  Users,
  Wallet,
  Settings as SettingsIcon,
  LogOut,
  Info,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/auth');
        },
      },
    ]);
  };

  const menuItems = [
    {
      id: 'communities',
      icon: Users,
      label: 'Communities',
      subtitle: 'Join and manage groups',
      onPress: () => router.push('/communities'),
    },
    {
      id: 'wallet',
      icon: Wallet,
      label: 'Wallet',
      subtitle: 'Payments & earnings (Coming Soon)',
      onPress: () =>
        Alert.alert('Coming Soon', 'Wallet feature will be available soon!'),
    },
    {
      id: 'settings',
      icon: SettingsIcon,
      label: 'Settings',
      subtitle: 'App preferences',
      onPress: () => router.push('/settings'),
    },
    {
      id: 'support',
      icon: Info,
      label: 'Support',
      subtitle: 'Contact support',
      onPress: () => router.push('/support'),
    },
  ];


  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Account',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                onPress={item.onPress}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.primary}15` },
                  ]}
                >
                  <Icon size={24} color={colors.primary} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuLabel, { color: colors.text }]}>
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.menuSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    {item.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.logoutButton,
              { backgroundColor: colors.card, borderColor: colors.error },
            ]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.version, { color: colors.textSecondary }]}>
          Version 1.0.0
        </Text>
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
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 16,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    paddingBottom: 40,
  },
});
