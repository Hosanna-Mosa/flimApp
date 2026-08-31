import React from 'react';
import { Bell } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';

export default function NotificationsSection({ onOpen }: { onOpen: () => void }) {
  return (
    <Section title="Notifications">
      <SettingsRow
        icon={Bell}
        label="Notification Settings"
        description="Configure likes, comments, messages, and system pushes"
        onPress={onOpen}
      />
    </Section>
  );
}
