// Single source of truth for typography across the app.
//
// Before this file existed, screens hardcoded fontSize/fontWeight ad-hoc —
// an audit found 16 distinct fontSize values (8,10,11,12,13,14,15,16,17,18,
// 20,22,24,28,32,36) and fontWeight written 5 different ways ('500','600',
// '700','900','bold') for what was often the same intended weight. The
// scale below absorbs every one of those values via nearest-neighbor
// snapping, so consistent visual sizes are used everywhere going forward.

export const fontSize = {
  '2xs': 10,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

// Roughly 1.3x the font size, rounded to an even number, capped so large
// headings don't get disproportionately loose leading.
export const lineHeight = {
  '2xs': 14,
  xs: 16,
  sm: 20,
  base: 22,
  lg: 24,
  xl: 26,
  '2xl': 30,
  '3xl': 34,
  '4xl': 38,
  '5xl': 42,
} as const;

export type FontSizeToken = keyof typeof fontSize;
export type FontWeightToken = keyof typeof fontWeight;

export interface TextVariant {
  fontSize: number;
  fontWeight: (typeof fontWeight)[FontWeightToken];
  lineHeight: number;
}

// Semantic presets — pick by role ("this is a screen title") rather than
// by raw pixel value, so intent stays consistent even if the scale is
// retuned later.
export const textVariants = {
  display: { fontSize: fontSize['5xl'], fontWeight: fontWeight.bold, lineHeight: lineHeight['5xl'] },
  h1: { fontSize: fontSize['4xl'], fontWeight: fontWeight.bold, lineHeight: lineHeight['4xl'] },
  h2: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, lineHeight: lineHeight['3xl'] },
  h3: { fontSize: fontSize['2xl'], fontWeight: fontWeight.bold, lineHeight: lineHeight['2xl'] },
  h4: { fontSize: fontSize.xl, fontWeight: fontWeight.semibold, lineHeight: lineHeight.xl },
  h5: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, lineHeight: lineHeight.lg },

  bodyLarge: { fontSize: fontSize.base, fontWeight: fontWeight.regular, lineHeight: lineHeight.base },
  bodyLargeMedium: { fontSize: fontSize.base, fontWeight: fontWeight.medium, lineHeight: lineHeight.base },
  bodyLargeSemibold: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: lineHeight.base },

  body: { fontSize: fontSize.sm, fontWeight: fontWeight.regular, lineHeight: lineHeight.sm },
  bodyMedium: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, lineHeight: lineHeight.sm },
  bodySemibold: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, lineHeight: lineHeight.sm },

  caption: { fontSize: fontSize.xs, fontWeight: fontWeight.regular, lineHeight: lineHeight.xs },
  captionMedium: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, lineHeight: lineHeight.xs },
  label: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, lineHeight: lineHeight.xs },

  overline: { fontSize: fontSize['2xs'], fontWeight: fontWeight.semibold, lineHeight: lineHeight['2xs'] },

  button: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: lineHeight.base },
  buttonSmall: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, lineHeight: lineHeight.sm },
} satisfies Record<string, TextVariant>;

export type TextVariantName = keyof typeof textVariants;
