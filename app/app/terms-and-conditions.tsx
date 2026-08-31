import React from 'react';
import Screen from '@/components/layout/Screen';
import TermsContent from '@/components/legal/TermsContent';

export default function TermsAndConditionsScreen() {
  return (
    <Screen title="Terms and Conditions" contentStyle={{ paddingBottom: 32 }}>
      <TermsContent />
    </Screen>
  );
}
