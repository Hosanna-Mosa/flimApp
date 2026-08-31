import React from 'react';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';
import Toggle from '@/components/ui/Toggle';

export default function AppearanceSection() {
  const { colors, isDark, changeTheme } = useTheme();
  return (
    <Section title="Appearance">
      <SettingsRow
        icon={isDark ? Moon : Sun}
        iconColor={colors.primary}
        label="Dark Mode"
        description={isDark ? 'Enabled' : 'Disabled'}
        trailing={<Toggle value={isDark} onValueChange={(v) => changeTheme(v ? 'dark' : 'light')} />}
      />
    </Section>
  );
}
