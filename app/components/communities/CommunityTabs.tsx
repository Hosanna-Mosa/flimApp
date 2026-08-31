import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Users, Globe } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityTab } from '@/hooks/useCommunities';

interface CommunityTabsProps {
  active: CommunityTab;
  onChange: (tab: CommunityTab) => void;
}

const TABS: { key: CommunityTab; label: string; icon: typeof Users }[] = [
  { key: 'my', label: 'My Communities', icon: Users },
  { key: 'discover', label: 'Discover', icon: Globe },
];

/** "My Communities" / "Discover" underline tabs at the top of the list. */
export default function CommunityTabs({ active, onChange }: CommunityTabsProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
      {TABS.map(({ key, label, icon: Icon }) => {
        const isActive = active === key;
        const color = isActive ? colors.primary : colors.textSecondary;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.tab, isActive && { borderBottomColor: colors.primary }]}
            onPress={() => onChange(key)}
          >
            <Icon size={16} color={color} />
            <Text style={[styles.tabText, { color }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
