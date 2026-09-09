import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Share2 } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import EmptyState from '@/components/ui/EmptyState';
import SharePreviewCard from '@/components/chat/SharePreviewCard';
import ShareTargetList from '@/components/share/ShareTargetList';
import { useAuth } from '@/contexts/AuthContext';
import { ShareTarget, useShareTargets } from '@/hooks/useShareTargets';
import { readStagedShare, setPendingShare, stageShare } from '@/utils/shareIntent';

/**
 * "Share to": where content handed over by the OS share sheet is pointed at a
 * conversation, a person, or a community group.
 *
 * Nothing is sent from here. Choosing a target opens that chat with the content
 * staged in its composer, so the last step is the ordinary Send — the same one,
 * through the same message and upload path, as anything else in the app.
 */
export default function ShareTargetScreen() {
  const { shareToken } = useLocalSearchParams<{ shareToken: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const targets = useShareTargets();

  // Held in state rather than read each render: choosing a target re-stages the
  // content under a new token, which would otherwise blank this screen out from
  // under the navigation that is already happening.
  const [share, setShare] = useState(() => readStagedShare(shareToken));
  useEffect(() => {
    const next = readStagedShare(shareToken);
    if (next) setShare(next);
  }, [shareToken]);

  // Reaching this screen signed out should not be possible — the share is
  // parked until auth resolves. If it happens anyway, park it again rather than
  // dropping it, and send the user through the normal sign-in.
  useEffect(() => {
    if (isLoading || isAuthenticated) return;
    if (share) {
      setPendingShare(share).catch((err) =>
        console.error('[share] Could not park the share for sign-in:', err)
      );
    }
    router.replace('/auth');
  }, [isLoading, isAuthenticated, share, router]);

  const openTarget = (target: ShareTarget) => {
    if (!share) return;
    const token = stageShare(share);

    // replace, not push: this picker has done its job, and Back from the chat
    // should go where the user was, not to a picker for a share already placed.
    if (target.kind === 'group' && target.communityId) {
      router.replace({
        pathname: '/communities/[id]/groups/[groupId]',
        params: { id: target.communityId, groupId: target.id, shareToken: token },
      });
      return;
    }

    router.replace({
      pathname: '/chat',
      params: { userId: target.id, name: target.name, shareToken: token },
    });
  };

  if (!share) {
    return (
      <Screen title="Share to">
        <EmptyState
          icon={Share2}
          title="Nothing to share"
          subtitle="This shared content is no longer available. Try sharing it again from the other app."
        />
      </Screen>
    );
  }

  return (
    <Screen title="Share to" padded={false}>
      <SharePreviewCard share={share} />
      <ShareTargetList
        query={targets.query}
        onQueryChange={targets.setQuery}
        chats={targets.chats}
        people={targets.people}
        groups={targets.groups}
        loadingChats={targets.loadingChats}
        searchingPeople={targets.searchingPeople}
        isEmpty={targets.isEmpty}
        onSelect={openTarget}
      />
    </Screen>
  );
}
