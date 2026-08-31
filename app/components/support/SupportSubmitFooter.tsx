import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { SendHorizontal } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface SupportSubmitFooterProps {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/** Pinned "Submit Request" pill button (Screen `footer` slot). */
export default function SupportSubmitFooter({ onPress, disabled, loading }: SupportSubmitFooterProps) {
  const { colors } = useTheme();
  const inactive = loading || disabled;
  return (
    <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, opacity: inactive ? 0.7 : 1 }]}
        onPress={onPress}
        disabled={inactive}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <SendHorizontal size={20} color="#FFFFFF" style={styles.icon} />
            <Text style={styles.label}>Submit Request</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
