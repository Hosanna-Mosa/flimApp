import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: LucideIcon;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm action as dangerous (red). */
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered themed confirmation dialog for irreversible actions. */
export default function ConfirmDialog({
  visible,
  title,
  message,
  icon: Icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {Icon && (
            <View style={[styles.iconWrap, { backgroundColor: `${destructive ? colors.error : colors.primary}20` }]}>
              <Icon size={28} color={destructive ? colors.error : colors.primary} />
            </View>
          )}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {!!message && <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>}
          <View style={styles.actions}>
            <Button title={cancelLabel} variant="outline" onPress={onCancel} style={styles.action} disabled={loading} />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              loading={loading}
              style={[styles.action, destructive && { backgroundColor: colors.error }]}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  action: {
    flex: 1,
  },
});
