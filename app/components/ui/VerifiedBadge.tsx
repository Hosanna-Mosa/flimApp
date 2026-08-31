import React from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface VerifiedBadgeProps {
  /** Pass the user's isVerified flag; renders nothing when falsy. */
  visible?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The verification tick. Hidden on iOS across the whole app (App Store
 * policy) — that platform guard lives here so no screen repeats it.
 */
export default function VerifiedBadge({ visible, size = 16, style }: VerifiedBadgeProps) {
  const { colors } = useTheme();

  if (!visible || Platform.OS === 'ios') return null;
  return <BadgeCheck size={size} color="#FFFFFF" fill={colors.link} style={style} />;
}
