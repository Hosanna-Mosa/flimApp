import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/ui/SearchBar';

interface NetworkSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

/** SearchBar in a bordered strip pinned above the followers / following list. */
export default function NetworkSearchBar({ value, onChangeText, placeholder }: NetworkSearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <SearchBar
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        onClear={() => onChangeText('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
});
