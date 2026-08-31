import React from 'react';
import { useRouter } from 'expo-router';
import Screen from '@/components/layout/Screen';
import SearchHeader from '@/components/search/SearchHeader';
import SearchResultList from '@/components/search/SearchResultList';
import SearchFiltersSheet from '@/components/search/SearchFiltersSheet';
import { useUserSearch } from '@/hooks/useUserSearch';

export default function SearchScreen() {
  const router = useRouter();
  const s = useUserSearch();

  return (
    <Screen title="Search" scroll={false} padded={false}>
      <SearchHeader
        value={s.query}
        onChangeText={s.setQuery}
        onClear={s.clearQuery}
        onOpenFilters={s.sheet.open}
        hasActiveFilters={s.filters.hasActive}
      />

      <SearchResultList
        results={s.results}
        isSearching={s.isSearching}
        hasCriteria={s.hasCriteria}
        onPressUser={(id) => router.push(`/user/${id}`)}
      />

      <SearchFiltersSheet
        visible={s.sheet.visible}
        onClose={s.sheet.close}
        roles={s.filters.roles}
        industries={s.filters.industries}
        onToggleRole={s.filters.toggleRole}
        onToggleIndustry={s.filters.toggleIndustry}
        onClear={s.filters.clear}
        onApply={s.filters.apply}
      />
    </Screen>
  );
}
