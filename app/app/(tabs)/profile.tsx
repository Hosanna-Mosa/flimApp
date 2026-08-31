import React from 'react';
import Screen from '@/components/layout/Screen';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';
import ProfileHeaderActions from '@/components/profile/ProfileHeaderActions';
import ProfileHeaderInfo from '@/components/profile/ProfileHeaderInfo';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ContentFilterTabs from '@/components/profile/ContentFilterTabs';
import PostGrid from '@/components/profile/PostGrid';
import { useMyProfile } from '@/hooks/useMyProfile';
import { emptyTitleForFilter } from '@/constants/contentFilters';

export default function ProfileScreen() {
  const p = useMyProfile();

  if (!p.user || !p.userId) {
    return null;
  }

  return (
    <Screen
      title="Profile"
      scroll={!p.loading}
      padded={false}
      refreshing={p.refreshing}
      onRefresh={p.onRefresh}
      headerRight={() => <ProfileHeaderActions />}
    >
      {p.loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <ProfileHeaderInfo user={p.user} boosted={p.user.isBoosted} placeholders />
          <ProfileStatsRow stats={p.stats} userId={p.userId} />
          <ContentFilterTabs selected={p.selectedFilter} onSelect={p.setSelectedFilter} />
          <PostGrid posts={p.filteredPosts} emptyTitle={emptyTitleForFilter(p.selectedFilter)} />
        </>
      )}
    </Screen>
  );
}
