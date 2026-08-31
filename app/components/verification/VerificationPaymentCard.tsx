import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface VerificationPaymentCardProps {
  /** Shows the Pay button in its loading state while checkout is open. */
  processing: boolean;
  onPay: () => void;
}

/**
 * "Documents Verified" state: approval header, the single 1-month plan card,
 * and the Razorpay pay footer. Web checkout runs on both platforms, so there
 * is no iOS gate here.
 */
export default function VerificationPaymentCard({ processing, onPay }: VerificationPaymentCardProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      contentContainerStyle={[styles.planContainer, { paddingBottom: insets.bottom + 20 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.planHeader}>
        <CheckCircle2 size={48} color={colors.success} />
        <Text style={[styles.planTitle, { color: colors.text }]}>Documents Verified!</Text>
        <Text style={[styles.planSubtitle, { color: colors.textSecondary }]}>
          Your documents have been approved. Activate your verification badge to stand out.
        </Text>
      </View>

      <View style={styles.planGrid}>
        <TouchableOpacity
          style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.popularText, { color: colors.onPrimary }]}>1 Month</Text>
          </View>
          <Text style={[styles.planLabel, { color: colors.text }]}>Verification Badge</Text>
          <Text style={[styles.planPrice, { color: colors.text }]}>
            ₹149
          </Text>
          <Text style={[styles.planDesc, { color: colors.textSecondary }]}>
            Get a blue checkmark on your profile and stand out in the community.
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.planFooter}>
        <Button
          title={processing ? 'Processing...' : 'Pay Now with Razorpay'}
          onPress={onPay}
          disabled={processing}
          loading={processing}
          size="large"
        />

        <Text style={[styles.secureText, { color: colors.textSecondary }]}>
          You&apos;ll be taken to Razorpay&apos;s secure page in your browser, then returned
          here automatically.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  planContainer: { padding: 20, alignItems: 'center' },
  planHeader: { alignItems: 'center', marginBottom: 32 },
  planTitle: { fontSize: 24, fontWeight: '700', marginTop: 12 },
  planSubtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 22 },

  planGrid: { width: '100%', marginBottom: 32 },
  planCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
  },
  popularText: { fontWeight: '700', fontSize: 10 },
  planLabel: { fontSize: 18, fontWeight: '700' },
  planPrice: { fontSize: 32, fontWeight: '700', marginVertical: 8 },
  planDesc: { fontSize: 14, lineHeight: 20 },

  planFooter: { width: '100%', alignItems: 'center' },
  secureText: { fontSize: 12, textAlign: 'center', marginTop: 20 },
});
