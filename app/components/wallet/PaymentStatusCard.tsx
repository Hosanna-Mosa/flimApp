import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Button from '@/components/Button';

export interface ReceiptRow {
  label: string;
  /** Plain text or a custom element (e.g. a status Chip). */
  value: string | React.ReactNode;
  bold?: boolean;
}

interface PaymentStatusAction {
  label: string;
  onPress: () => void;
}

interface PaymentStatusCardProps {
  icon: LucideIcon;
  /** Tints the icon, its ring, and the top wash. */
  iconColor: string;
  title: string;
  message: string;
  /** Optional receipt rows rendered in a card between the message and actions. */
  receipt?: ReceiptRow[];
  /** Replaces the icon with a spinner and hides the actions while a result is being confirmed. */
  loading?: boolean;
  primaryAction?: PaymentStatusAction;
  /** Rendered as a plain text link under the primary button. */
  secondaryAction?: PaymentStatusAction;
}

/**
 * Full-screen payment outcome: tinted icon, title, message, optional receipt,
 * and up to two actions. Used by wallet/success and payment-result so every
 * checkout ends on the same visual.
 */
export default function PaymentStatusCard({
  icon: Icon,
  iconColor,
  title,
  message,
  receipt,
  loading = false,
  primaryAction,
  secondaryAction,
}: PaymentStatusCardProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.flex}>
      <LinearGradient colors={[`${iconColor}1A`, 'transparent']} style={styles.gradient} />

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <View style={[styles.iconRing, { borderColor: `${iconColor}40`, backgroundColor: `${iconColor}10` }]}>
            <Icon size={80} color={iconColor} />
          </View>
        )}

        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

        {!!receipt?.length && (
          <View style={[styles.receipt, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {receipt.map((row, idx) => (
              <React.Fragment key={row.label}>
                {idx > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                  {typeof row.value === 'string' ? (
                    <Text style={[styles.receiptValue, { color: colors.text }, row.bold && styles.bold]}>
                      {row.value}
                    </Text>
                  ) : (
                    row.value
                  )}
                </View>
              </React.Fragment>
            ))}
          </View>
        )}

        {!loading && primaryAction && (
          <Button title={primaryAction.label} onPress={primaryAction.onPress} style={styles.button} size="large" />
        )}

        {!loading && secondaryAction && (
          <TouchableOpacity style={styles.link} onPress={secondaryAction.onPress}>
            <Text style={{ color: colors.textSecondary }}>{secondaryAction.label}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    height: '50%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  iconRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  receipt: {
    width: '100%',
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 40,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  receiptLabel: {
    fontSize: 14,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  bold: {
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    marginTop: 40,
  },
  link: {
    marginTop: 24,
    padding: 10,
  },
});
