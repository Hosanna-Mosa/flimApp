import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDate } from '@/utils/date';
import Button from '@/components/Button';

interface VerificationPendingCardProps {
  /** The pending request as returned by the API (null while loading). */
  requestData: { createdAt?: string; verificationType?: string } | null;
  onBack: () => void;
}

/** "Documents Under Review" state: clock, submitted-on info, back button. */
export default function VerificationPendingCard({ requestData, onBack }: VerificationPendingCardProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.statusCard, { paddingBottom: insets.bottom + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Clock size={64} color={colors.primary} />
      <Text style={[styles.statusTitle, { color: colors.text }]}>Documents Under Review</Text>
      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
        Your verification request is currently being reviewed by our team.
        We&apos;ll notify you once a decision is made. Then you can pick a plan.
      </Text>
      <View style={[styles.infoBox, { backgroundColor: colors.surface }]}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Submitted on:</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>
          {requestData ? formatDate(requestData.createdAt ?? '') : 'Loading...'}
        </Text>
        <Text style={[styles.infoLabel, styles.infoLabelSpaced, { color: colors.textSecondary }]}>Type:</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{requestData?.verificationType}</Text>
      </View>
      <Button title="Back to Settings" onPress={onBack} variant="outline" style={styles.backButton} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  statusCard: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 24, fontWeight: '700', marginTop: 24 },
  statusDesc: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  infoBox: { width: '100%', padding: 20, borderRadius: 16, marginTop: 32 },
  infoLabel: { fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  infoLabelSpaced: { marginTop: 8 },
  infoValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  backButton: { marginTop: 24, width: '100%' },
});
