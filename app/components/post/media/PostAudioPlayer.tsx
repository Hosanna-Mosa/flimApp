import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { Play, Pause } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import type { PostMediaVariant } from './PostVideoPlayer';

interface PostAudioPlayerProps {
  url?: string;
  /** Post id — used so only one audio plays at a time across the app. */
  audioId: string;
  /** In a list: pause when false. Omit on a single-post screen. */
  isActive?: boolean;
  variant?: PostMediaVariant;
}

const formatTime = (millis: number) => {
  const minutes = Math.floor(millis / 60000);
  const seconds = ((millis % 60000) / 1000).toFixed(0);
  return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
};

/** Play/pause button + seekable progress slider for an audio post. */
export default function PostAudioPlayer({ url, audioId, isActive, variant = 'feed' }: PostAudioPlayerProps) {
  const { colors } = useTheme();
  const audio = useAudioPlayer(url, audioId, isActive);
  const isDetail = variant === 'detail';

  return (
    <View style={[styles.card, isDetail ? styles.cardDetail : styles.cardFeed, { backgroundColor: colors.surface }]}>
      <View style={[styles.row, { gap: isDetail ? 12 : 16 }]}>
        <TouchableOpacity onPress={audio.toggle} disabled={audio.loading}>
          {audio.loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : audio.isPlaying ? (
            <Pause size={32} color={colors.primary} fill={colors.primary} />
          ) : (
            <Play size={32} color={colors.primary} fill={colors.primary} />
          )}
        </TouchableOpacity>

        <View style={styles.progress}>
          <Text style={[styles.time, isDetail && styles.timeDetail, { color: colors.textSecondary }]}>
            {formatTime(audio.position)}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={audio.duration || 100}
            value={audio.position}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            onSlidingComplete={audio.seek}
            disabled={!audio.isLoaded}
          />
          <Text style={[styles.time, isDetail && styles.timeDetail, { color: colors.textSecondary }]}>
            {audio.duration ? formatTime(audio.duration) : '--:--'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  cardFeed: {
    width: '100%',
    minHeight: 100,
    justifyContent: 'center',
  },
  cardDetail: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  time: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
  },
  timeDetail: {
    minWidth: 35,
  },
});
