import React from 'react';
import { Trash2 } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';

export default function DangerZoneSection({ onDeleteAccount }: { onDeleteAccount: () => void }) {
  return (
    <Section>
      <SettingsRow icon={Trash2} label="Delete My Account" destructive onPress={onDeleteAccount} trailing="none" />
    </Section>
  );
}
