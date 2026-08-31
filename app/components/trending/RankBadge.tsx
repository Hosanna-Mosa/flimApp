import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/** "#n" tag pinned to the top-left corner of a trending card. */
export default function RankBadge({ rank }: { rank: number }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>#{rank}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    left: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 6,
    zIndex: 10,
    borderBottomRightRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: '700',
    fontSize: 12,
  },
});
