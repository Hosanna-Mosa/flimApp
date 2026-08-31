import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface OnboardingFooterProps {
  /** 1-based current step. */
  step: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Sticky Next / Complete Setup button with Back under it from step 2 on. */
export default function OnboardingFooter({
  step,
  totalSteps,
  onNext,
  onBack,
  disabled,
  loading,
}: OnboardingFooterProps) {
  const { colors } = useTheme();
  const isLast = step === totalSteps;

  return (
    <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
      <Button
        title={isLast ? 'Complete Setup' : 'Next'}
        onPress={onNext}
        size="large"
        loading={loading}
        disabled={disabled}
      />
      {step > 1 && <Button title="Back" onPress={onBack} variant="outline" style={styles.back} />}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
  },
  back: { marginTop: 10 },
});
