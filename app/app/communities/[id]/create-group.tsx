import React, { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import Screen from '@/components/layout/Screen';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';
import Toggle from '@/components/ui/Toggle';
import CommunityHeaderAction from '@/components/communities/CommunityHeaderAction';
import CommunityFieldCard from '@/components/communities/CommunityFieldCard';

export default function CreateGroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAnnouncementOnly, setIsAnnouncementOnly] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      setLoading(true);
      await api.createGroup(
        id!,
        {
          name,
          description,
          type: isAnnouncementOnly ? 'announcement' : 'discussion',
          isAnnouncementOnly,
        },
        token || undefined
      );

      Alert.alert('Success', 'Group created successfully');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen
      title="Create Group"
      keyboard
      headerRight={() => <CommunityHeaderAction label="Create" onPress={handleCreate} loading={loading} />}
    >
      <CommunityFieldCard
        style={{ marginBottom: 24 }}
        fields={[
          {
            label: 'Group Name',
            value: name,
            onChangeText: setName,
            placeholder: 'e.g. Project Discussions',
            autoFocus: true,
          },
          {
            label: 'Description',
            value: description,
            onChangeText: setDescription,
            placeholder: 'What is this group for?',
            multiline: true,
          },
        ]}
      />

      <Section title="Settings">
        <SettingsRow
          label="Announcement Only"
          description="Only admins can post messages"
          trailing={<Toggle value={isAnnouncementOnly} onValueChange={setIsAnnouncementOnly} />}
        />
      </Section>
    </Screen>
  );
}
