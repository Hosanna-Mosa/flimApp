import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';

interface TextLinkProps {
  label: string;
  onPress: () => void;
  /** 'end' right-aligns the link (e.g. "Forgot Password?"). */
  align?: 'start' | 'center' | 'end';
  style?: StyleProp<ViewStyle>;
}

/** Inline tappable text in the primary colour. */
export default function TextLink({ label, onPress, align = 'start', style }: TextLinkProps) {
  const { colors } = useTheme();
  const alignSelf = align === 'end' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start';
  return (
    <TouchableOpacity onPress={onPress} style={[{ alignSelf }, style]} hitSlop={8}>
      <AppText variant="bodySemibold" color={colors.primary}>
        {label}
      </AppText>
    </TouchableOpacity>
  );
}
