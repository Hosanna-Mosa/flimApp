import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import EmptyState from '@/components/ui/EmptyState';
import SearchBar from '@/components/ui/SearchBar';
import { Country } from '@/utils/country';
import { COUNTRIES } from '@/constants/countries';

interface CountryPickerProps {
  onSelect: (country: Country) => void;
  selectedCountryCode?: string;
}

/**
 * Country picker backed by the bundled list in constants/countries — no network.
 * Built with NO native dependencies for cross-platform compatibility.
 */
export default function CountryPicker({ onSelect, selectedCountryCode }: CountryPickerProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const countries = COUNTRIES;

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.callingCode.includes(query) ||
        c.code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  const renderItem = ({ item }: { item: Country }) => {
    const isSelected = selectedCountryCode === item.code;

    return (
      <TouchableOpacity
        style={[
          styles.row,
          { borderBottomColor: colors.border },
          isSelected && { backgroundColor: colors.surface },
        ]}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.countryInfo}>
          <Text style={styles.flag}>{item.flag}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        </View>
        <Text style={[styles.callingCode, { color: colors.textSecondary }]}>
          {item.callingCode}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <SearchBar
          placeholder="Search country or code..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchContainer}
        />
      </View>

      <FlatList
        data={filteredCountries}
        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <EmptyState title="No countries found" variant="fullscreen" />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  searchContainer: {
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 24,
    marginRight: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  callingCode: {
    fontSize: 16,
    marginLeft: 8,
  },
});
