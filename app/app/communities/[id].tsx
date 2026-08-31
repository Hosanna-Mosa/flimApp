import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { MoreHorizontal } from 'lucide-react-native';
import { useCommunity } from '@/hooks/useCommunity';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import CommunityHeader from '@/components/communities/CommunityHeader';
import GroupList from '@/components/communities/GroupList';
import CommunityFab from '@/components/communities/CommunityFab';

export default function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useCommunity(id);

  if (c.loading && !c.refreshing) {
    return (
      <Screen title="" headerShown scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  return (
    // Empty title on the stack header; the name is shown in the content header.
    <Screen
      title=""
      headerShown
      scroll={false}
      padded={false}
      headerRight={() => (
        <HeaderIconButton icon={MoreHorizontal} accessibilityLabel="Community options" onPress={c.openMenu} />
      )}
    >
      <GroupList
        groups={c.groups}
        header={<CommunityHeader community={c.community} onJoin={c.joinCommunity} />}
        refreshing={c.refreshing}
        onRefresh={c.refresh}
        onOpen={c.openGroup}
        onJoin={c.joinGroup}
        showJoin={c.showJoinForGroup}
      />

      {c.isAdmin && <CommunityFab onPress={c.createGroup} />}
    </Screen>
  );
}
