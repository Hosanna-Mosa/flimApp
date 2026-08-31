const colors = {
  light: {
    primary: '#D4AF37',
    // Content rendered on top of `primary` surfaces (button labels, icons).
    onPrimary: '#000000',
    secondary: '#1A1A1A',
    // Light mode uses the grouped-list convention: an off-white page with
    // white cards/rows on it, so a row reads as a row without relying on a
    // hairline border. Mirrors the background < surface < card steps in dark.
    background: '#F4F5F7',
    surface: '#E9EBEF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    border: '#DADDE3',
    // Stronger line for separating list items / posts (border is for card edges).
    divider: '#C9CDD4',
    error: '#DC2626',
    success: '#16A34A',
    warning: '#D97706',
    link: '#0095F6',
    overlay: 'rgba(0, 0, 0, 0.5)',
    tab: '#FFFFFF',
    tabActive: '#D4AF37',
    tabInactive: '#999999',
  },
  dark: {
    primary: '#D4AF37',
    onPrimary: '#000000',
    secondary: '#FFFFFF',
    background: '#000000',
    // Distinct elevation steps — background < surface < card — so raised
    // elements are visible without faking depth with borders.
    surface: '#121212',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#262626',
    divider: '#3A3A3A',
    error: '#EF4444',
    success: '#22C55E',
    warning: '#F59E0B',
    link: '#0095F6',
    overlay: 'rgba(0, 0, 0, 0.7)',
    tab: '#000000',
    tabActive: '#D4AF37',
    tabInactive: '#666666',
  },
};

export default colors;
