import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HandCoins } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import ScreenIntro from '@/components/layout/ScreenIntro';
import EmptyState from '@/components/ui/EmptyState';
import Fab from '@/components/ui/Fab';
import FeedSkeletonList from '@/components/home/FeedSkeletonList';
import FeedPost from '@/components/FeedPost';
import { useDonations } from '@/hooks/useDonations';

export default function DonationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const d = useDonations();

  return (
    <Screen
      title="Crowd Fund"
      padded={false}
      refreshing={d.refreshing}
      onRefresh={d.onRefresh}
      contentStyle={{
        paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 80) : 80, // Extra padding for FAB
      }}
      footer={
        <Fab
          onPress={() => router.push('/donations/create')}
          bottom={Platform.OS === 'android' ? Math.max(insets.bottom, 24) : 24}
          accessibilityLabel="Create crowd fund request"
        />
      }
    >
      <ScreenIntro icon={HandCoins} title="Support Content" layout="row" />

      {d.isLoading ? (
        <FeedSkeletonList count={5} />
      ) : d.posts.length === 0 ? (
        <EmptyState title="No crowd fund requests yet. Be the first!" />
      ) : (
        d.posts.map((post) => (
          <FeedPost
            key={post.id}
            post={post}
            onLike={d.handleLike}
            onComment={d.handleComment}
            onShare={d.handleShare}
            onSave={d.handleSave}
            isActive={false}
          />
        ))
      )}
    </Screen>
  );
}
