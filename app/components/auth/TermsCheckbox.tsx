import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { CheckSquare, Square } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';

const TERMS_URL = 'https://filmyconnect24.com/terms-and-conditions';
const PRIVACY_URL = 'https://filmyconnect24.com/privacy-policy';

interface TermsCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

/** "I agree to the Terms and Conditions and Privacy Policy" row with linked text. */
export default function TermsCheckbox({ checked, onToggle }: TermsCheckboxProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity style={styles.row} onPress={onToggle} activeOpacity={0.8}>
      {checked ? (
        <CheckSquare size={20} color={colors.primary} />
      ) : (
        <Square size={20} color={colors.textSecondary} />
      )}
      <AppText variant="body" secondary style={styles.text}>
        I agree to the{' '}
        <Text style={{ color: colors.primary }} onPress={() => Linking.openURL(TERMS_URL)}>
          Terms and Conditions
        </Text>{' '}
        and{' '}
        <Text style={{ color: colors.primary }} onPress={() => Linking.openURL(PRIVACY_URL)}>
          Privacy Policy
        </Text>
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    marginTop: 8,
  },
  text: {
    flex: 1,
    lineHeight: 18,
  },
});
