import React from 'react';
import Screen from '@/components/layout/Screen';
import PersonalDetailsForm from '@/components/account/PersonalDetailsForm';
import { usePersonalDetails } from '@/hooks/usePersonalDetails';

export default function PersonalDetailsScreen() {
  const d = usePersonalDetails();

  return (
    <Screen title="Personal Details" keyboard contentStyle={{ paddingBottom: 40 }}>
      <PersonalDetailsForm
        values={d.values}
        onChange={d.setField}
        onManagePortfolio={d.openPortfolio}
        onSave={d.save}
        saving={d.saving}
      />
    </Screen>
  );
}
