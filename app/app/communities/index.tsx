import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useCommunities } from '@/hooks/useCommunities';
import Screen from '@/components/layout/Screen';
import SearchBar from '@/components/ui/SearchBar';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import CommunityTabs from '@/components/communities/CommunityTabs';
import CommunityList from '@/components/communities/CommunityList';

export default function CommunitiesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const c = useCommunities();

  return (
    <Screen
      title="Communities"
      scroll={false}
      padded={false}
      headerRight={() => (
        <HeaderIconButton
          icon={Plus}
          color={colors.primary}
          accessibilityLabel="Create community"
          onPress={() => router.push('/communities/create')}
        />
      )}
    >
      <CommunityTabs active={c.activeTab} onChange={c.setActiveTab} />

      {c.activeTab === 'discover' && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <SearchBar
            value={c.searchQuery}
            onChangeText={c.setSearchQuery}
            placeholder="Search communities..."
          />
        </View>
      )}

      <CommunityList
        communities={c.communities}
        loading={c.loading}
        refreshing={c.refreshing}
        onRefresh={c.refresh}
        joiningId={c.joiningId}
        onJoin={c.join}
        onDiscover={c.activeTab === 'my' ? () => c.setActiveTab('discover') : undefined}
      />
    </Screen>
  );
}
