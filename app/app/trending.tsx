import React from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Flame } from 'lucide-react-native';
import Screen from '@/components/layout/Screen';
import ScreenIntro from '@/components/layout/ScreenIntro';
import TrendingList from '@/components/trending/TrendingList';
import { useTrending } from '@/hooks/useTrending';

export default function TrendingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useTrending();

  return (
    <Screen
      title="Trending"
      padded={false}
      refreshing={t.refreshing}
      onRefresh={t.onRefresh}
      contentStyle={{ paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 20) : 0 }}
    >
      <ScreenIntro icon={Flame} title="Trending Now" layout="row" />

      <TrendingList posts={t.posts} loading={t.isLoading} onPressPost={(post) => router.push(`/post/${post.id}`)} />
    </Screen>
  );
}
