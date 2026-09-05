import React from 'react';
import Constants from 'expo-constants';
import Screen from '@/components/layout/Screen';
import AppText from '@/components/AppText';
import AccountMenu from '@/components/account/AccountMenu';
import LogoutRow from '@/components/account/LogoutRow';
import { useAccount } from '@/hooks/useAccount';

const appVersion = Constants.expoConfig?.version ?? '';

export default function AccountScreen() {
  const a = useAccount();

  return (
    <Screen title="Account" padded={false}>
      <AccountMenu />
      <LogoutRow onPress={a.confirmLogout} />
      {/* Read rather than written in: this said 1.0.0 while the app was on
          1.0.3. A hardcoded version is wrong from the first release after it is
          typed and nothing makes it fail loudly. */}
      <AppText variant="caption" secondary align="center" style={{ paddingBottom: 40 }}>
        Version {appVersion}
      </AppText>
    </Screen>
  );
}
