import React from 'react';
import Screen from '@/components/layout/Screen';
import AppText from '@/components/AppText';
import AccountMenu from '@/components/account/AccountMenu';
import LogoutRow from '@/components/account/LogoutRow';
import { useAccount } from '@/hooks/useAccount';

export default function AccountScreen() {
  const a = useAccount();

  return (
    <Screen title="Account" padded={false}>
      <AccountMenu />
      <LogoutRow onPress={a.confirmLogout} />
      <AppText variant="caption" secondary align="center" style={{ paddingBottom: 40 }}>
        Version 1.0.0
      </AppText>
    </Screen>
  );
}
