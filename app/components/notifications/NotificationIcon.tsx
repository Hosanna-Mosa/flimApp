import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Bell, CheckCircle2 } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface NotificationIconProps {
  isRead: boolean;
}

/** Tinted square icon at the left of a notification card. */
export default function NotificationIcon({ isRead }: NotificationIconProps) {
  const { colors } = useTheme();
  const tint = isRead ? colors.textSecondary : colors.primary;

  return (
    <View style={[styles.iconWrap, { backgroundColor: `${tint}20` }]}>
      {isRead ? <CheckCircle2 size={20} color={tint} /> : <Bell size={20} color={tint} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
