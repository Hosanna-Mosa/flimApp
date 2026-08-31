import React from 'react';
import { useCommunityForm } from '@/hooks/useCommunityForm';
import Screen from '@/components/layout/Screen';
import Button from '@/components/Button';
import CommunityIconPicker from '@/components/communities/CommunityIconPicker';
import CommunityForm from '@/components/communities/CommunityForm';
import PrivacySelector from '@/components/communities/PrivacySelector';

export default function CreateCommunityScreen() {
  const f = useCommunityForm();

  return (
    <Screen title="New Community" keyboard>
      <CommunityIconPicker uri={f.avatarUri} onPick={f.pickImage} disabled={f.loading} />

      <CommunityForm
        name={f.name}
        description={f.description}
        type={f.type}
        industry={f.industry}
        onChangeName={f.setName}
        onChangeDescription={f.setDescription}
        onChangeType={f.setType}
        onChangeIndustry={f.setIndustry}
      />

      <PrivacySelector value={f.privacy} onChange={f.setPrivacy} />

      <Button
        title="Create Community"
        onPress={f.submit}
        loading={f.loading}
        size="large"
        style={{ borderRadius: 30, marginTop: 12 }}
      />
    </Screen>
  );
}
