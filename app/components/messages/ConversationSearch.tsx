import React from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from '@/components/ui/SearchBar';

interface ConversationSearchProps {
  value: string;
  onChangeText: (text: string) => void;
}

/** Padded search bar above the conversation list. */
export default function ConversationSearch({ value, onChangeText }: ConversationSearchProps) {
  return (
    <View style={styles.container}>
      <SearchBar value={value} onChangeText={onChangeText} placeholder="Search conversations..." />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
