import React from 'react';
import { Shield, Lock } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';
import Toggle from '@/components/ui/Toggle';

interface PrivacySectionProps {
  isPrivate: boolean;
  isUpdatingPrivate: boolean;
  onTogglePrivate: () => void;
  onChangePassword: () => void;
}

export default function PrivacySection({
  isPrivate,
  isUpdatingPrivate,
  onTogglePrivate,
  onChangePassword,
}: PrivacySectionProps) {
  return (
    <Section title="Privacy & Security">
      <SettingsRow
        icon={Shield}
        label="Private Account"
        description={isPrivate ? 'Only approved followers can see your posts' : 'Anyone can see your posts'}
        trailing={<Toggle value={isPrivate} onValueChange={onTogglePrivate} loading={isUpdatingPrivate} />}
      />
      <SettingsRow
        icon={Lock}
        label="Change Password"
        description="Update your account password"
        onPress={onChangePassword}
      />
    </Section>
  );
}
