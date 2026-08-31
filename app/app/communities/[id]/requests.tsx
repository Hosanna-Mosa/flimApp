import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useJoinRequests } from '@/hooks/useJoinRequests';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import JoinRequestList from '@/components/communities/JoinRequestList';

export default function JoinRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const r = useJoinRequests(id);

  if (r.loading && !r.refreshing) {
    return (
      <Screen title="Join Requests" scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  return (
    <Screen title="Join Requests" scroll={false} padded={false}>
      <JoinRequestList
        requests={r.requests}
        refreshing={r.refreshing}
        onRefresh={r.refresh}
        onApprove={r.approve}
        onReject={r.reject}
      />
    </Screen>
  );
}
