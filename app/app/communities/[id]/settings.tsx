import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Users, Save } from 'lucide-react-native';
import { useCommunitySettings } from '@/hooks/useCommunitySettings';
import Screen from '@/components/layout/Screen';
import Section from '@/components/layout/Section';
import LoadingScreen from '@/components/ui/LoadingScreen';
import SettingsRow from '@/components/ui/SettingsRow';
import CommunityHeaderAction from '@/components/communities/CommunityHeaderAction';
import CommunityFieldCard from '@/components/communities/CommunityFieldCard';
import PrivacyRadioRows from '@/components/communities/PrivacyRadioRows';
import PendingRequestsRow from '@/components/communities/PendingRequestsRow';

export default function CommunitySettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useCommunitySettings(id);

  if (s.loading) {
    return (
      <Screen title="Settings" scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  return (
    <Screen
      title="Settings"
      keyboard
      headerRight={() => (
        <CommunityHeaderAction icon={Save} onPress={s.save} loading={s.saving} accessibilityLabel="Save" />
      )}
    >
      <Section title="General">
        <CommunityFieldCard
          fields={[
            { label: 'Name', value: s.name, onChangeText: s.setName, placeholder: 'Community Name' },
            {
              label: 'Description',
              value: s.description,
              onChangeText: s.setDescription,
              placeholder: 'Describe your community...',
              multiline: true,
            },
          ]}
        />
      </Section>

      <Section title="Privacy">
        <PrivacyRadioRows value={s.privacy} onChange={s.setPrivacy} />
      </Section>

      <Section title="Members">
        <PendingRequestsRow count={s.pendingCount} onPress={s.openRequests} />
        <SettingsRow icon={Users} label="Manage Members" onPress={s.openMembers} />
      </Section>

      {s.isOwner && (
        <Section title="Danger Zone">
          <SettingsRow label="Delete Community" destructive onPress={s.remove} trailing="none" />
        </Section>
      )}
    </Screen>
  );
}
