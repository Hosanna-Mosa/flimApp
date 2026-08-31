import React from 'react';
import { Bell } from 'lucide-react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/Button';
import SettingsRow from '@/components/ui/SettingsRow';
import Toggle from '@/components/ui/Toggle';
import type { PushKey } from '@/hooks/useSettings';

const PUSH_OPTIONS: { key: PushKey; label: string; description: string }[] = [
  { key: 'pushLikes', label: 'Likes', description: 'Notify when someone likes your post' },
  { key: 'pushComments', label: 'Comments & Replies', description: 'Notify when someone comments on your post' },
  { key: 'pushFollows', label: 'Follows & Network', description: 'Notify when someone follows or requests to follow' },
  { key: 'pushMessages', label: 'Direct Messages', description: 'Notify when you receive a message' },
  { key: 'pushBoosts', label: 'Boosts & Account Status', description: 'Notify when your profile boost ends or status changes' },
];

interface NotificationSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  isEnabled: (key: PushKey) => boolean;
  onToggle: (key: PushKey) => void;
  updating: boolean;
}

export default function NotificationSettingsSheet({
  visible,
  onClose,
  isEnabled,
  onToggle,
  updating,
}: NotificationSettingsSheetProps) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Notification Settings"
      footer={<Button title="Done" onPress={onClose} />}
    >
      {PUSH_OPTIONS.map((opt) => (
        <SettingsRow
          key={opt.key}
          icon={Bell}
          label={opt.label}
          description={opt.description}
          trailing={<Toggle value={isEnabled(opt.key)} onValueChange={() => onToggle(opt.key)} disabled={updating} />}
        />
      ))}
    </BottomSheet>
  );
}
