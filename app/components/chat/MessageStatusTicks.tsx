import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

export type MessageStatus = 'sent' | 'delivered' | 'read';

interface MessageStatusTicksProps {
  /** Missing status is treated as 'sent'. */
  status?: MessageStatus;
  size?: number;
}

/** Single tick = sent, double = delivered, blue double = read. */
export default function MessageStatusTicks({ status, size = 14 }: MessageStatusTicksProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      {(status === 'sent' || !status) && <Check size={size} color={colors.textSecondary} />}
      {status === 'delivered' && <CheckCheck size={size} color={colors.textSecondary} />}
      {status === 'read' && <CheckCheck size={size} color={colors.link} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
});
