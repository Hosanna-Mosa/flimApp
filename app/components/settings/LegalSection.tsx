import React from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, FileText } from 'lucide-react-native';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';

export default function LegalSection() {
  const router = useRouter();
  return (
    <Section title="Legal">
      <SettingsRow
        icon={Shield}
        label="Privacy Policy"
        onPress={() => Linking.openURL('https://filmyconnect24.com/privacy-policy')}
      />
      <SettingsRow
        icon={FileText}
        label="Terms and Conditions"
        onPress={() => router.push('/terms-and-conditions')}
      />
    </Section>
  );
}
