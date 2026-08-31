import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BadgeCheck, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

interface VerificationActiveCardProps {
  onGoToProfile: () => void;
}

/** "You're Verified" state: success icon, copy, the big badge, profile CTA. */
export default function VerificationActiveCard({ onGoToProfile }: VerificationActiveCardProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.statusCard, { paddingBottom: insets.bottom + 20 }]}>
      <CheckCircle2 size={64} color={colors.success} />
      <Text style={[styles.statusTitle, { color: colors.text }]}>You&apos;re Verified!</Text>
      <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>
        Congratulations! Your account has been verified. The verification badge is now visible on your profile.
      </Text>
      {/* The tick glyph is white on its filled badge in both themes (same as ui/VerifiedBadge). */}
      <BadgeCheck size={100} color="#FFFFFF" fill={colors.primary} style={styles.badge} />
      <Button title="Go to Profile" onPress={onGoToProfile} style={styles.profileButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  statusCard: { flex: 1, padding: 40, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 24, fontWeight: '700', marginTop: 24 },
  statusDesc: { fontSize: 16, textAlign: 'center', marginTop: 12, lineHeight: 24 },
  badge: { marginTop: 20 },
  profileButton: { marginTop: 32, width: '100%' },
});
