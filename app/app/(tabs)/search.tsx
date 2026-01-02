import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SlidersHorizontal, X, Search as SearchIcon, BadgeCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { User, UserRole, Industry } from '@/types';
import { ROLES } from '@/constants/roles';
import { INDUSTRIES } from '@/constants/industries';
import Button from '@/components/Button';
import SelectableCard from '@/components/SelectableCard';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([]);
  const [results, setResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || selectedRoles.length > 0 || selectedIndustries.length > 0) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedRoles, selectedIndustries]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      const params = {
        q: searchQuery,
        roles: selectedRoles,
        industries: selectedIndustries,
      };
      
      // console.log('[Search] Performing search with params:', params);
      const response = await api.searchUsers(params, token || undefined) as any;
      // console.log('[Search] Response:', response);
      
      if (response && response.data) {
        // console.log('[Search] Results count:', response.data.length);
        setResults(response.data);
      } else if (response && Array.isArray(response)) {
        // console.log('[Search] Response is array, count:', response.length);
        setResults(response);
      } else {
        // console.log('[Search] No data in response');
        setResults([]);
      }
    } catch (error) {
      // console.error('[Search] Error:', error);
    } finally {
      setIsSearching(false);
      setShowFilters(false); // Close modal after search
    }
  };

  const handleToggleRole = (roleId: string) => {
    const role = roleId as UserRole;
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleToggleIndustry = (industryId: string) => {
    const industry = industryId as Industry;
    if (selectedIndustries.includes(industry)) {
      setSelectedIndustries(selectedIndustries.filter((i) => i !== industry));
    } else {
      setSelectedIndustries([...selectedIndustries, industry]);
    }
  };

  const clearFilters = () => {
    setSelectedRoles([]);
    setSelectedIndustries([]);
    setSearchQuery('');
    setResults([]);
    setShowFilters(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Search',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SearchIcon size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Search professionals..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                 <X size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilters(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SlidersHorizontal size={20} color="#000000" />
            {(selectedRoles.length > 0 || selectedIndustries.length > 0) && (
              <View style={styles.filterBadge} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
          {isSearching ? (
             <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
          ) : results.length > 0 ? (
            results.map((user) => (
            <TouchableOpacity
              key={user.id || (user as any)._id}
              style={[
                styles.userCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/user/${user.id || (user as any)._id}`)}
            >
              <Image
                source={{ uri: user.avatar }}
                style={styles.avatar}
                contentFit="cover"
              />
              <View style={styles.userInfo}>
                <View style={styles.userHeader}>
                  <Text style={[styles.userName, { color: colors.text }]}>
                    {user.name}
                  </Text>
                  {user.isVerified && (
                    <BadgeCheck size={14} color="#FFFFFF" fill={colors.primary} style={{ marginLeft: 4 }} />
                  )}
                  {user.isOnline && (
                    <View
                      style={[
                        styles.onlineBadge,
                        { backgroundColor: colors.success },
                      ]}
                    />
                  )}
                </View>
                
                {/* Roles */}
                {user.roles && user.roles.length > 0 && (
                  <Text style={[styles.rolesText, { color: colors.text }]} numberOfLines={1}>
                    <Text style={{ fontWeight: '600' }}>Roles: </Text>
                    {user.roles.slice(0, 3).join(', ')}
                  </Text>
                )}
                
                {/* Industries */}
                {user.industries && user.industries.length > 0 && (
                  <Text style={[styles.industriesText, { color: colors.textSecondary }]} numberOfLines={1}>
                    <Text style={{ fontWeight: '600' }}>Industries: </Text>
                    {user.industries.slice(0, 3).join(', ')}
                  </Text>
                )}
                
                {/* Bio */}
                {user.bio && (
                  <Text
                    style={[styles.bio, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {user.bio}
                  </Text>
                )}
                
                {/* Location */}
                {user.location && (
                  <Text style={[styles.location, { color: colors.primary }]}>
                    📍 {user.location}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          )) 
          ) : searchQuery.trim() || selectedRoles.length > 0 || selectedIndustries.length > 0 ? (
             <Text style={[styles.emptyState, { color: colors.textSecondary }]}>No results found</Text>
          ) : (
             <Text style={[styles.emptyState, { color: colors.textSecondary }]}>Start typing to search...</Text>
          )}
        </ScrollView>

        <Modal
          visible={showFilters}
          animationType="slide"
          transparent
          onRequestClose={() => setShowFilters(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Filters
                </Text>
                <TouchableOpacity 
                  onPress={() => setShowFilters(false)}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Roles
                </Text>
                {ROLES.map((role) => (
                  <SelectableCard
                    key={role.id}
                    id={role.id}
                    label={role.label}
                    icon={role.icon}
                    selected={selectedRoles.includes(role.id)}
                    onToggle={handleToggleRole}
                  />
                ))}

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Industries
                </Text>
                {INDUSTRIES.map((industry) => (
                  <SelectableCard
                    key={industry.id}
                    id={industry.id}
                    label={industry.label}
                    description={industry.description}
                    selected={selectedIndustries.includes(industry.id)}
                    onToggle={handleToggleIndustry}
                    color={industry.color}
                  />
                ))}
              </ScrollView>

              <View
                style={[styles.modalFooter, { borderTopColor: colors.border }]}
              >
                <Button
                  title="Clear"
                  onPress={clearFilters}
                  variant="outline"
                  style={styles.footerButton}
                />
                <Button
                  title="Apply"
                  onPress={performSearch}
                  style={styles.footerButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
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
  emptyState: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  results: {
    flex: 1,
  },
  userCard: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  rolesText: {
    fontSize: 13,
    marginTop: 4,
    textTransform: 'capitalize' as const,
  },
  industriesText: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize' as const,
  },
  onlineBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  role: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  bio: {
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  location: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
  },
});
