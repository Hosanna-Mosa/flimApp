import React from 'react';
import { AlertTriangle } from 'lucide-react-native';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface DeleteAccountDialogProps {
  visible: boolean;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteAccountDialog({ visible, loading, onConfirm, onCancel }: DeleteAccountDialogProps) {
  return (
    <ConfirmDialog
      visible={visible}
      title="Delete Account?"
      message="You want to delete your account? If you delete, all your data will be permanently deleted. This includes your profile, posts, messages, and followers."
      icon={AlertTriangle}
      confirmLabel="Delete"
      destructive
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
