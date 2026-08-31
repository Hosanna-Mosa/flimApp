import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/ui/SearchBar';

interface SearchHeaderProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onOpenFilters: () => void;
  /** Shows the red dot on the filter button. */
  hasActiveFilters: boolean;
}

/** Search bar plus the filter button (with an "active filters" dot). */
export default function SearchHeader({
  value,
  onChangeText,
  onClear,
  onOpenFilters,
  hasActiveFilters,
}: SearchHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <SearchBar
        value={value}
        onChangeText={onChangeText}
        placeholder="Search professionals..."
        onClear={onClear}
        style={styles.bar}
      />

      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: colors.primary }]}
        onPress={onOpenFilters}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <SlidersHorizontal size={20} color={colors.onPrimary} />
        {hasActiveFilters && <View style={styles.filterBadge} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  bar: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: 'white',
  },
});
