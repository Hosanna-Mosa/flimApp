import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LogOut } from 'lucide-react-native';
import SettingsRow from '@/components/ui/SettingsRow';

/** Destructive "Logout" row in its own padded block under the account menu. */
export default function LogoutRow({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.section}>
      <SettingsRow icon={LogOut} label="Logout" destructive onPress={onPress} trailing="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 20,
  },
});
