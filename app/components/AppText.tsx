import React from 'react';
import { Text, TextProps, TextStyle, StyleProp } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { textVariants, TextVariantName, fontWeight, FontWeightToken } from '@/constants/typography';

interface AppTextProps extends TextProps {
  variant?: TextVariantName;
  weight?: FontWeightToken;
  color?: string;
  secondary?: boolean;
  align?: TextStyle['textAlign'];
  style?: StyleProp<TextStyle>;
}

// Shared Text primitive — the typography scale in constants/typography.ts
// is the single source of truth for size/weight/line-height, so any screen
// using AppText automatically stays visually consistent with the rest of
// the app. Prefer this over raw <Text style={{ fontSize, fontWeight }}>.
export default function AppText({
  variant = 'body',
  weight,
  color,
  secondary = false,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  const { colors } = useTheme();

  const variantStyle = textVariants[variant];
  const resolvedColor = color ?? (secondary ? colors.textSecondary : colors.text);

  const composedStyle: StyleProp<TextStyle> = [
    variantStyle,
    { color: resolvedColor },
    weight && { fontWeight: fontWeight[weight] },
    align && { textAlign: align },
    style,
  ];

  return (
    <Text style={composedStyle} {...rest}>
      {children}
    </Text>
  );
}
