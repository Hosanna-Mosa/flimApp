import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from '@/components/ui/BottomSheet';
import Input from '@/components/Input';
import Button from '@/components/Button';

interface ChangePasswordSheetProps {
  visible: boolean;
  onClose: () => void;
  step: 1 | 2;
  current: string;
  next: string;
  confirm: string;
  loading: boolean;
  onChangeCurrent: (v: string) => void;
  onChangeNext: (v: string) => void;
  onChangeConfirm: (v: string) => void;
  onVerify: () => void;
  onSubmit: () => void;
}

export default function ChangePasswordSheet({
  visible,
  onClose,
  step,
  current,
  next,
  confirm,
  loading,
  onChangeCurrent,
  onChangeNext,
  onChangeConfirm,
  onVerify,
  onSubmit,
}: ChangePasswordSheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Change Password"
      footer={<Button title="Cancel" variant="outline" onPress={onClose} disabled={loading} />}
    >
      <View style={styles.body}>
        {step === 1 ? (
          <>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              To set a new password, please enter your current password first.
            </Text>
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={current}
              onChangeText={onChangeCurrent}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button title="Continue" onPress={onVerify} loading={loading} style={styles.action} />
          </>
        ) : (
          <>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              Create a new password that is at least 6 characters long.
            </Text>
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={next}
              onChangeText={onChangeNext}
              secureTextEntry
              autoCapitalize="none"
            />
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirm}
              onChangeText={onChangeConfirm}
              secureTextEntry
              autoCapitalize="none"
              containerStyle={styles.secondInput}
            />
            <Button title="Change Password" onPress={onSubmit} loading={loading} style={styles.action} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { paddingBottom: 8 },
  hint: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginBottom: 16 },
  secondInput: { marginTop: 12 },
  action: { marginTop: 16 },
});
