import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { LucideIcon, Users, Wallet, Settings as SettingsIcon, Flame, Zap } from 'lucide-react-native';
import SettingsRow from '@/components/ui/SettingsRow';

interface AccountMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  subtitle: string;
  href: Href;
}

const MENU_ITEMS: AccountMenuItem[] = [
  { id: 'communities', icon: Users, label: 'Communities', subtitle: 'Join and manage groups', href: '/communities' },
  { id: 'trending', icon: Flame, label: 'Trending', subtitle: "See what's popular", href: '/trending' },
  // Both run on Razorpay web checkout, so neither is platform-gated.
  { id: 'wallet', icon: Wallet, label: 'Wallet', subtitle: 'Payments & earnings', href: '/wallet' },
  { id: 'boost', icon: Zap, label: 'Profile Boost', subtitle: 'Priority feed placement', href: '/boost' },
  { id: 'settings', icon: SettingsIcon, label: 'Settings', subtitle: 'App preferences', href: '/settings' },
];

/** The Account tab's navigation list, driven by MENU_ITEMS. */
export default function AccountMenu() {
  const router = useRouter();
  return (
    <View style={styles.section}>
      {MENU_ITEMS.map((item) => (
        <SettingsRow
          key={item.id}
          icon={item.icon}
          iconTinted
          label={item.label}
          description={item.subtitle}
          onPress={() => router.push(item.href)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
});
