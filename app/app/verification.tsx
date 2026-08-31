import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useVerification, VerificationStatus } from '@/hooks/useVerification';
import VerificationPendingCard from '@/components/verification/VerificationPendingCard';
import VerificationPaymentCard from '@/components/verification/VerificationPaymentCard';
import VerificationActiveCard from '@/components/verification/VerificationActiveCard';
import VerificationApplicationForm from '@/components/verification/VerificationApplicationForm';
import VerificationTypeSheet from '@/components/verification/VerificationTypeSheet';
import DocumentTypeSheet from '@/components/verification/DocumentTypeSheet';

const titleFor = (status: VerificationStatus) => {
  if (status === 'APPROVED_DOCS') return 'Activate Badge';
  if (status === 'PENDING_DOCS' || status === 'ACTIVE') return 'Verification Status';
  return 'Apply for Verification';
};

export default function VerificationScreen() {
  const router = useRouter();
  const v = useVerification();
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDocTypePicker, setShowDocTypePicker] = useState(false);

  const renderContent = () => {
    switch (v.status) {
      case 'LOADING':
        return <LoadingScreen />;
      case 'PENDING_DOCS':
        return <VerificationPendingCard requestData={v.requestData} onBack={() => router.back()} />;
      case 'APPROVED_DOCS':
        return <VerificationPaymentCard processing={v.isProcessingPayment} onPay={v.handlePayment} />;
      case 'ACTIVE':
        return <VerificationActiveCard onGoToProfile={() => router.push('/profile')} />;
      default:
        // NONE and REJECTED show the application form.
        return (
          <VerificationApplicationForm
            rejected={v.status === 'REJECTED'}
            rejectionNotes={v.requestData?.adminNotes}
            verificationType={v.form.verificationType}
            reason={v.form.reason}
            onChangeReason={v.form.setReason}
            documents={v.form.documents}
            isSubmitting={v.form.isSubmitting}
            uploadProgress={v.form.uploadProgress}
            onOpenTypePicker={() => setShowTypePicker(true)}
            onOpenDocPicker={() => setShowDocTypePicker(true)}
            onRemoveDocument={v.form.removeDocument}
            onSubmit={v.form.submit}
          />
        );
    }
  };

  return (
    <Screen title={titleFor(v.status)} scroll={false} padded={false} edges={['left', 'right']}>
      {renderContent()}

      <VerificationTypeSheet
        visible={showTypePicker}
        onClose={() => setShowTypePicker(false)}
        selected={v.form.verificationType}
        onSelect={v.form.setVerificationType}
      />

      <DocumentTypeSheet
        visible={showDocTypePicker}
        onClose={() => setShowDocTypePicker(false)}
        selectedType={v.docDraft.type}
        onSelectType={v.docDraft.setType}
        name={v.docDraft.name}
        onChangeName={v.docDraft.setName}
        onContinue={async () => {
          if (await v.docDraft.add()) setShowDocTypePicker(false);
        }}
      />
    </Screen>
  );
}
