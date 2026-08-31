import React, { useState } from 'react';
import Screen from '@/components/layout/Screen';
import { useSettings } from '@/hooks/useSettings';
import AppearanceSection from '@/components/settings/AppearanceSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import AccountSection from '@/components/settings/AccountSection';
import PrivacySection from '@/components/settings/PrivacySection';
import LegalSection from '@/components/settings/LegalSection';
import DangerZoneSection from '@/components/settings/DangerZoneSection';
import NotificationSettingsSheet from '@/components/settings/NotificationSettingsSheet';
import ChangePasswordSheet from '@/components/settings/ChangePasswordSheet';
import DeleteAccountDialog from '@/components/settings/DeleteAccountDialog';

export default function SettingsScreen() {
  const s = useSettings();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const closePassword = () => {
    s.password.reset();
    setShowPassword(false);
  };

  return (
    <Screen title="Settings">
      <AppearanceSection />
      <NotificationsSection onOpen={() => setShowNotifications(true)} />
      <AccountSection
        verificationStatus={s.user?.verificationStatus}
        verifiedUntil={s.user?.verifiedUntil}
      />
      <PrivacySection
        isPrivate={s.isPrivate}
        isUpdatingPrivate={s.isUpdatingPrivate}
        onTogglePrivate={s.togglePrivateAccount}
        onChangePassword={() => setShowPassword(true)}
      />
      <LegalSection />
      <DangerZoneSection onDeleteAccount={() => setShowDelete(true)} />

      <NotificationSettingsSheet
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        isEnabled={s.isPushEnabled}
        onToggle={s.togglePush}
        updating={s.isUpdatingPush}
      />
      <ChangePasswordSheet
        visible={showPassword}
        onClose={closePassword}
        step={s.password.step}
        current={s.password.current}
        next={s.password.next}
        confirm={s.password.confirm}
        loading={s.password.loading}
        onChangeCurrent={s.password.setCurrent}
        onChangeNext={s.password.setNext}
        onChangeConfirm={s.password.setConfirm}
        onVerify={s.password.verifyCurrent}
        onSubmit={async () => {
          if (await s.password.change()) setShowPassword(false);
        }}
      />
      <DeleteAccountDialog
        visible={showDelete}
        loading={s.isDeleting}
        onConfirm={async () => {
          if (!(await s.deleteMyAccount())) setShowDelete(false);
        }}
        onCancel={() => setShowDelete(false)}
      />
    </Screen>
  );
}
