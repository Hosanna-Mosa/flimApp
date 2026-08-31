import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole, Industry } from '@/types';

/**
 * Search-tab logic: debounced people search over the query + role/industry
 * filters, the filter sheet's open state, and Clear / Apply.
 */
export function useUserSearch() {
  const { token, blockedUsers } = useAuth();
  const [query, setQuery] = useState<string>('');
  const [sheetVisible, setSheetVisible] = useState<boolean>(false);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const hasFilters = roles.length > 0 || industries.length > 0;
  const hasCriteria = !!query.trim() || hasFilters;

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim() || roles.length > 0 || industries.length > 0) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, roles, industries]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const params = {
        q: query,
        roles,
        industries,
      };

      const response = (await api.searchUsers(params, token || undefined)) as any;

      if (response && response.data) {
        const filteredResults = response.data.filter((u: any) => !blockedUsers.includes(u.id || u._id));
        setResults(filteredResults);
      } else if (response && Array.isArray(response)) {
        const filteredResults = response.filter((u: any) => !blockedUsers.includes(u.id || u._id));
        setResults(filteredResults);
      } else {
        setResults([]);
      }
    } catch {
      // Swallowed: a failed search leaves the previous results in place.
    } finally {
      setIsSearching(false);
    }
  };

  // Close the sheet only on an explicit Apply — performSearch also runs from
  // the debounced text effect, which must not dismiss the open filter sheet.
  const applyFilters = () => {
    setSheetVisible(false);
    performSearch();
  };

  const toggleRole = (roleId: string) => {
    const role = roleId as UserRole;
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
  };

  const toggleIndustry = (industryId: string) => {
    const industry = industryId as Industry;
    if (industries.includes(industry)) {
      setIndustries(industries.filter((i) => i !== industry));
    } else {
      setIndustries([...industries, industry]);
    }
  };

  const clearFilters = () => {
    setRoles([]);
    setIndustries([]);
    setQuery('');
    setResults([]);
    setSheetVisible(false);
  };

  return {
    query,
    setQuery,
    clearQuery: () => setQuery(''),
    results,
    isSearching,
    hasCriteria,
    filters: {
      roles,
      industries,
      hasActive: hasFilters,
      toggleRole,
      toggleIndustry,
      apply: applyFilters,
      clear: clearFilters,
    },
    sheet: {
      visible: sheetVisible,
      open: () => setSheetVisible(true),
      close: () => setSheetVisible(false),
    },
  };
}
