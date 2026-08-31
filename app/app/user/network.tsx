import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import LoadingScreen from '@/components/ui/LoadingScreen';
import NetworkSearchBar from '@/components/network/NetworkSearchBar';
import NetworkUserList from '@/components/network/NetworkUserList';
import { useNetwork, NetworkType } from '@/hooks/useNetwork';

export default function UserNetworkScreen() {
  const router = useRouter();
  const { userId, type } = useLocalSearchParams<{ userId: string; type: NetworkType }>();
  const n = useNetwork(userId, type);

  return (
    <Screen
      title={n.title}
      headerLeft={() => (
        <HeaderIconButton
          icon={ArrowLeft}
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={{ marginRight: 10 }}
        />
      )}
      scroll={false}
      padded={false}
    >
      <NetworkSearchBar
        value={n.searchQuery}
        onChangeText={n.setSearchQuery}
        placeholder={`Search ${n.title.toLowerCase()}...`}
      />

      {n.showLoading ? (
        <LoadingScreen />
      ) : (
        <NetworkUserList
          users={n.users}
          refreshing={n.refreshing}
          onRefresh={n.onRefresh}
          onEndReached={n.loadMore}
          loadingMore={n.loadingMore}
          emptyTitle={n.emptyTitle}
        />
      )}
    </Screen>
  );
}
