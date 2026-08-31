import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { User as UserIcon, BadgeCheck, Info } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate } from '@/utils/date';
import Section from '@/components/layout/Section';
import SettingsRow from '@/components/ui/SettingsRow';

interface AccountSectionProps {
  verificationStatus?: string;
  verifiedUntil?: string;
}

export default function AccountSection({ verificationStatus, verifiedUntil }: AccountSectionProps) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <Section title="Account">
      <SettingsRow
        icon={UserIcon}
        label="Personal Details"
        description="Edit email, phone, location, and more"
        onPress={() => router.push('/personal-details')}
      />
      {Platform.OS !== 'ios' && (
        <SettingsRow
          icon={BadgeCheck}
          iconColor={colors.primary}
          label="Verification"
          description={
            verificationStatus === 'active' && verifiedUntil
              ? `Active until ${formatDate(verifiedUntil)}`
              : 'Apply for a verified badge'
          }
          onPress={() => router.push('/verification')}
        />
      )}
      <SettingsRow
        icon={Info}
        label="Support"
        description="Contact support for help"
        onPress={() => router.push('/support')}
      />
    </Section>
  );
}
