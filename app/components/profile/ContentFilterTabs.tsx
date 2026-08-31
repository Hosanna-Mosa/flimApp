import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CONTENT_FILTERS, ContentFilter, ContentFilterOption } from '@/constants/contentFilters';

interface ContentFilterTabsProps {
  selected: ContentFilter;
  onSelect: (filter: ContentFilter) => void;
  /** Defaults to every content type + All. */
  filters?: ContentFilterOption[];
}

/** Horizontal, underline-style tabs that filter a profile's post grid by content type. */
export default function ContentFilterTabs({ selected, onSelect, filters = CONTENT_FILTERS }: ContentFilterTabsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.filters, { borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => {
          const Icon = filter.icon;
          const active = selected === filter.id;
          const color = active ? colors.primary : colors.textSecondary;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filter, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => onSelect(filter.id)}
            >
              <Icon size={20} color={color} />
              <Text style={[styles.filterText, { color }]}>{filter.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    borderBottomWidth: 1,
    paddingHorizontal: 20,
  },
  filter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
