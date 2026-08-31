import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, Edit } from 'lucide-react-native';
import HeaderIconButton from '@/components/ui/HeaderIconButton';

/** Right-hand header cluster on the own profile tab: saved posts and edit profile. */
export default function ProfileHeaderActions() {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <HeaderIconButton
        icon={Bookmark}
        size={20}
        accessibilityLabel="Saved posts"
        onPress={() => router.push('/saved')}
      />
      <HeaderIconButton
        icon={Edit}
        size={20}
        accessibilityLabel="Edit profile"
        onPress={() => router.push('/edit-profile')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 8,
  },
});
