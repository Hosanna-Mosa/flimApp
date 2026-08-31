import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { XCircle } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface VerificationRejectionCardProps {
  /** Admin notes from the declined request; a default reason is shown when empty. */
  adminNotes?: string;
}

/** Inline "Request Declined" notice shown above the form after a rejection. */
export default function VerificationRejectionCard({ adminNotes }: VerificationRejectionCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.rejectionCard, { backgroundColor: `${colors.error}10`, borderColor: colors.error }]}>
      <View style={styles.rejectionHeader}>
        <XCircle size={20} color={colors.error} />
        <Text style={[styles.rejectionTitle, { color: colors.error }]}>Request Declined</Text>
      </View>
      <Text style={[styles.rejectionReason, { color: colors.text }]}>
        Reason: {adminNotes || 'Doesn\'t meet requirements at this time.'}
      </Text>
      <Text style={[styles.rejectionText, { color: colors.textSecondary }]}>
        You can apply again after ensuring all requirements are met.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  rejectionCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 24 },
  rejectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  rejectionTitle: { fontWeight: '700', fontSize: 16 },
  rejectionReason: { fontWeight: '600', marginBottom: 4 },
  rejectionText: { fontSize: 14 },
});
