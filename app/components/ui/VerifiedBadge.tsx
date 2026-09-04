import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { BadgeCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface VerifiedBadgeProps {
  /** Pass the user's isVerified flag; renders nothing when falsy. */
  visible?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The verification tick, shown on every platform.
 *
 * This was previously hidden on iOS. The badge is sold as a subscription, and
 * hiding it there kept a paid digital feature out of sight on the platform
 * that requires such things to go through In-App Purchase.
 */
export default function VerifiedBadge({ visible, size = 16, style }: VerifiedBadgeProps) {
  const { colors } = useTheme();

  if (!visible) return null;
  return <BadgeCheck size={size} color="#FFFFFF" fill={colors.link} style={style} />;
}
