import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import BottomSheet from '@/components/ui/BottomSheet';
import Button from '@/components/Button';
import QuickAmountChips from '@/components/wallet/QuickAmountChips';

interface AmountEntrySheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  value: string;
  onChange: (value: string) => void;
  /** Preset amounts shown as chips under the input. */
  quickAmounts?: string[];
  submitLabel?: string;
  onSubmit: () => void;
}

/** Bottom sheet with a large rupee input, quick-amount chips, and a submit footer. */
export default function AmountEntrySheet({
  visible,
  onClose,
  title,
  value,
  onChange,
  quickAmounts,
  submitLabel = 'Next',
  onSubmit,
}: AmountEntrySheetProps) {
  const { colors } = useTheme();

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
      footer={<Button title={submitLabel} onPress={onSubmit} variant="primary" style={styles.submit} />}
    >
      <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.currency, { color: colors.text }]}>₹</Text>
        <TextInput
          style={[styles.input, { color: colors.text }]}
          keyboardType="numeric"
          value={value}
          onChangeText={onChange}
          autoFocus={true}
          placeholder="0.00"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {!!quickAmounts?.length && <QuickAmountChips amounts={quickAmounts} selected={value} onSelect={onChange} />}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    height: 72,
    marginBottom: 24,
  },
  currency: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    height: '100%',
  },
  submit: {
    height: 56,
  },
});
