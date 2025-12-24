import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { Image } from 'expo-image';
import { SlidersHorizontal, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { mockUsers } from '@/mocks/posts';
import { User, UserRole, Industry } from '@/types';
import { ROLES } from '@/constants/roles';
import { INDUSTRIES } from '@/constants/industries';
import Input from '@/components/Input';
import Button from '@/components/Button';
import SelectableCard from '@/components/SelectableCard';

export default function SearchScreen() {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [selectedIndustries, setSelectedIndustries] = useState<Industry[]>([]);
  const [results, setResults] = useState<User[]>(mockUsers);

  const handleSearch = () => {
    let filtered = mockUsers;

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.bio.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedRoles.length > 0) {
      filtered = filtered.filter((user) =>
        user.roles.some((role) => selectedRoles.includes(role))
      );
    }

    if (selectedIndustries.length > 0) {
      filtered = filtered.filter((user) =>
        user.industries.some((industry) =>
          selectedIndustries.includes(industry)
        )
      );
    }

    setResults(filtered);
    setShowFilters(false);
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
    setResults(mockUsers);
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
          <Input
            placeholder="Search professionals..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            style={styles.searchInput}
            containerStyle={styles.searchInputContainer}
          />
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowFilters(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <SlidersHorizontal size={20} color="#000000" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.results} showsVerticalScrollIndicator={false}>
          {results.map((user) => (
            <View
              key={user.id}
              style={[
                styles.userCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
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
                  {user.isOnline && (
                    <View
                      style={[
                        styles.onlineBadge,
                        { backgroundColor: colors.success },
                      ]}
                    />
                  )}
                </View>
                <Text style={[styles.role, { color: colors.textSecondary }]}>
                  {user.roles.slice(0, 3).join(' • ')}
                </Text>
                <Text
                  style={[styles.bio, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {user.bio}
                </Text>
                <Text style={[styles.location, { color: colors.primary }]}>
                  {user.location}
                </Text>
              </View>
            </View>
          ))}
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
                  onPress={handleSearch}
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
  searchInput: {
    flex: 1,
    marginBottom: 0,
    height: 48,
  },
  searchInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
