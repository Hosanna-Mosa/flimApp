import React from 'react';
import { StyleSheet } from 'react-native';
import Button from '@/components/Button';

interface BoostButtonProps {
  /** Disabled until a plan is picked. */
  enabled: boolean;
  processing: boolean;
  onPress: () => void;
}

/** The screen's primary CTA; swaps its label while the checkout runs. */
export default function BoostButton({ enabled, processing, onPress }: BoostButtonProps) {
  return (
    <Button
      title={processing ? 'Processing...' : 'Boost My Profile Now'}
      onPress={onPress}
      disabled={!enabled || processing}
      loading={processing}
      style={styles.button}
      size="large"
    />
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: 20,
    height: 64,
  },
});
