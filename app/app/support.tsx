import React from 'react';
import Screen from '@/components/layout/Screen';
import SupportForm from '@/components/support/SupportForm';
import SupportSubmitFooter from '@/components/support/SupportSubmitFooter';
import { useSupport } from '@/hooks/useSupport';

export default function SupportScreen() {
  const s = useSupport();

  return (
    <Screen
      title="Support"
      keyboard
      footer={<SupportSubmitFooter onPress={s.submit} disabled={!s.canSubmit} loading={s.isLoading} />}
    >
      <SupportForm
        reason={s.reason}
        onChangeReason={s.setReason}
        imageUri={s.imageUri}
        onPickImage={s.pickImage}
        onRemoveImage={s.removeImage}
      />
    </Screen>
  );
}
