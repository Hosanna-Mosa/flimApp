import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';

interface AuthHeaderProps {
  /** Renders the back arrow when provided. */
  onBack?: () => void;
  /** Plain heading; when omitted the FILMYCONNECT wordmark is shown. */
  title?: string;
  subtitle?: string;
}

/** Top of every auth form: back arrow, wordmark (or title) and optional subtitle. */
export default function AuthHeader({ onBack, title, subtitle }: AuthHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, !!onBack && styles.withBack]}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
      )}
      {title ? (
        <AppText variant="h2" style={!!subtitle && styles.titleSpaced}>
          {title}
        </AppText>
      ) : (
        <AppText variant="h2" weight="regular" style={[styles.wordmark, !!subtitle && styles.titleSpaced]}>
          FILMYCONNECT
        </AppText>
      )}
      {!!subtitle && (
        <AppText variant="bodyLarge" secondary>
          {subtitle}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 40,
  },
  withBack: {
    marginTop: 20,
  },
  backButton: {
    marginBottom: 20,
  },
  wordmark: {
    fontFamily: 'Geometric415Black',
    textTransform: 'uppercase',
  },
  titleSpaced: {
    marginBottom: 8,
  },
});
