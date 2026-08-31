import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import Screen from '@/components/layout/Screen';
import EmptyState from '@/components/ui/EmptyState';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import { ReportButton } from '@/components/ReportButton';
import ProfileHeaderInfo from '@/components/profile/ProfileHeaderInfo';
import ProfileNotice from '@/components/profile/ProfileNotice';
import ProfileActionButtons from '@/components/profile/ProfileActionButtons';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ContentFilterTabs from '@/components/profile/ContentFilterTabs';
import PostGrid from '@/components/profile/PostGrid';
import { useUserProfile } from '@/hooks/useUserProfile';
import { emptyTitleForFilter } from '@/constants/contentFilters';

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = useUserProfile(id);

  if (p.loading) {
    return (
      <Screen title="Profile" scroll={false} padded={false}>
        <ProfileSkeleton />
      </Screen>
    );
  }

  if (!p.user) {
    return (
      <Screen title="Profile" scroll={false} padded={false}>
        <EmptyState title="User not found" variant="fullscreen" />
      </Screen>
    );
  }

  const user = p.user;

  return (
    <Screen title={user.name} headerRight={() => <ReportButton type="user" id={id} />} padded={false}>
      <ProfileHeaderInfo
        user={user}
        limited={p.hasLimitedData}
        onPressPortfolio={p.openPortfolio}
        portfolioCount={user.portfolio?.length}
      />
      {p.hasLimitedData && <ProfileNotice variant="private" />}
      {p.isBlockedUser && <ProfileNotice variant="blocked" />}
      <ProfileActionButtons
        isFollowing={p.isFollowing}
        isPending={p.isPending}
        isPrivateAccount={p.isPrivateAccount}
        disabled={p.isBlockedUser}
        onToggleFollow={p.toggleFollow}
        onMessage={p.handleMessage}
      />
      <ProfileStatsRow stats={user.stats} userId={id} interactive={!p.hasLimitedData} />

      {p.hasLimitedData ? (
        <ProfileNotice variant="privatePosts" />
      ) : (
        <>
          <ContentFilterTabs selected={p.selectedFilter} onSelect={p.setSelectedFilter} />
          <PostGrid posts={p.filteredPosts} emptyTitle={emptyTitleForFilter(p.selectedFilter)} />
        </>
      )}
    </Screen>
  );
}
