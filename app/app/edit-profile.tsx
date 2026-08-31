import React from 'react';
import Screen from '@/components/layout/Screen';
import EditProfileForm from '@/components/account/EditProfileForm';
import { useEditProfile } from '@/hooks/useEditProfile';

export default function EditProfileScreen() {
  const e = useEditProfile();

  return (
    <Screen title="Edit Profile" keyboard contentStyle={{ paddingBottom: 40 }}>
      <EditProfileForm
        values={e.values}
        onChange={e.setField}
        onChangeUsername={e.setUsername}
        onPickAvatar={e.pickAvatar}
        onSave={e.save}
        saving={e.saving}
        userId={e.user?.id}
        userName={e.user?.name}
      />
    </Screen>
  );
}
