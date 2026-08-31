import React from 'react';
import { View, StyleSheet } from 'react-native';
import AppText from '@/components/AppText';

const GUIDELINES = ['no abusive content', 'no harassment', 'no illegal content'];

/** The three-line community rules reminder under the Sign Up terms checkbox. */
export default function CommunityGuidelinesList() {
  return (
    <View style={styles.list}>
      {GUIDELINES.map((rule) => (
        <AppText key={rule} variant="caption" secondary>
          - {rule}
        </AppText>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    marginTop: 8,
    marginBottom: 4,
    paddingLeft: 30,
    gap: 4,
  },
});
