import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useCommunityMembers } from '@/hooks/useCommunityMembers';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MemberList from '@/components/communities/MemberList';

export default function CommunityMembersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = useCommunityMembers(id);

  if (m.loading) {
    return (
      <Screen title="Members" scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  return (
    <Screen title="Members" scroll={false} padded={false}>
      <MemberList
        members={m.members}
        canManage={m.canManage}
        loadingMore={m.loadingMore}
        onLoadMore={m.loadMore}
        onMemberAction={m.openMemberActions}
      />
    </Screen>
  );
}
