import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Input from './Input';
import { Country, RestCountry, mapRestCountryToCountry } from '@/utils/country';

interface CountryPickerProps {
  onSelect: (country: Country) => void;
  selectedCountryCode?: string;
}

/**
 * A custom Country Picker component that fetches data from REST Countries API.
 * Built with NO native dependencies for cross-platform compatibility.
 */
export default function CountryPicker({ onSelect, selectedCountryCode }: CountryPickerProps) {
  const { colors } = useTheme();
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        'https://restcountries.com/v3.1/all?fields=name,cca2,idd'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      const data: RestCountry[] = await response.json();
      
      const mappedCountries = data
        .map(mapRestCountryToCountry)
        // Filter out countries without a calling code if necessary, 
        // but typically all have at least a root.
        .filter((c) => c.callingCode !== '')
        .sort((a, b) => a.name.localeCompare(b.name));

      setCountries(mappedCountries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.statusText, { color: colors.textSecondary, marginTop: 12 }]}>
          Loading countries...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={[styles.statusText, { color: colors.error }]}>{error}</Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchCountries}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Input
          placeholder="Search country or code..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          renderLeft={() => (
            <View style={styles.searchIcon}>
              <Search size={20} color={colors.textSecondary} />
            </View>
          )}
          containerStyle={styles.searchContainer}
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
          <View style={styles.center}>
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              No countries found
            </Text>
          </View>
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
  searchIcon: {
    paddingLeft: 16,
    justifyContent: 'center',
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
