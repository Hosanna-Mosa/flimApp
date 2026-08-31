import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

// Accent for the far end of the hero wash; the brand has no purple token.
const HERO_ACCENT = '#9C27B0';

/** Gradient header for the Boost screen: bolt icon, headline, and tagline. */
export default function BoostHero() {
  const { colors } = useTheme();

  return (
    <LinearGradient
      colors={[colors.primary, HERO_ACCENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.header}
    >
      <Zap size={48} color={colors.onPrimary} />
      <Text style={[styles.title, { color: colors.onPrimary }]}>Skyrocket Your Reach</Text>
      <Text style={[styles.subtitle, { color: `${colors.onPrimary}B3` }]}>
        Boosted profiles get priority placement in the global feed.
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
