import React from 'react';
import { View, Text, StyleSheet, Platform, StyleProp, ViewStyle } from 'react-native';

const GOLD = '#FFD700';

interface BoostBadgeProps {
  /** Pass the user's isBoosted flag; renders nothing when falsy. */
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * "PROFILE BOOST ACTIVE" pill under a boosted user's name. Boost is a paid
 * feature that is hidden on iOS, so that platform guard lives here.
 */
export default function BoostBadge({ visible, style }: BoostBadgeProps) {
  if (!visible || Platform.OS === 'ios') return null;

  return (
    <View style={[styles.badge, style]}>
      <Text style={styles.text}>PROFILE BOOST ACTIVE 🚀</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    backgroundColor: GOLD,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  text: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
