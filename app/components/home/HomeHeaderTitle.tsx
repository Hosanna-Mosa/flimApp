import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

/** The FILMYCONNECT wordmark used as the home tab's header title. */
export default function HomeHeaderTitle() {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }]}>FILMYCONNECT</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontFamily: 'Geometric415Black',
    fontSize: 24,
  },
});
