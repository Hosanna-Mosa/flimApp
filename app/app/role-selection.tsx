import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';
import { UserRole } from '@/types';
import SelectableCard from '@/components/SelectableCard';
import Button from '@/components/Button';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);

  const handleToggleRole = (roleId: string) => {
    const role = roleId as UserRole;
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleContinue = async () => {
    await updateUserRoles(selectedRoles);
    router.push('/industry-selection');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Select Your Roles
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose all that apply (you can change this later)
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {ROLES.map((role) => (
            <SelectableCard
              key={role.id}
              id={role.id}
              label={role.label}
              icon={role.icon}
              selected={selectedRoles.includes(role.id)}
              onToggle={handleToggleRole}
            />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { backgroundColor: colors.background, borderTopColor: colors.border },
        ]}
      >
        <Button
          title="Continue"
          onPress={handleContinue}
          size="large"
          disabled={selectedRoles.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  rolesContainer: {
    gap: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
});
