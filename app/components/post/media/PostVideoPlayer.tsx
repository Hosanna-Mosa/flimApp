import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Play, Volume2, VolumeX } from 'lucide-react-native';
import { useMedia } from '@/contexts/MediaContext';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';

export type PostMediaVariant = 'feed' | 'detail';

interface PostVideoPlayerProps {
  url: string;
  thumbnailUrl?: string;
  aspectRatio: number;
  /** In a list: autoplay when true, pause when false. Omit on a single-post screen. */
  isActive?: boolean;
  variant?: PostMediaVariant;
}

/**
 * Looping video with custom controls: tap-to-toggle, centre play button
 * while paused, and the app-wide mute toggle (MediaContext).
 */
export default function PostVideoPlayer({
  url,
  thumbnailUrl,
  aspectRatio,
  isActive,
  variant = 'feed',
}: PostVideoPlayerProps) {
  const { isMuted, toggleMute } = useMedia();
  const { videoRef, isPlaying, didJustFinish, setStatus, toggle } = useVideoPlayer(isActive);
  const isDetail = variant === 'detail';

  return (
    <View style={[styles.container, { aspectRatio }]}>
      <Video
        ref={videoRef}
        style={styles.media}
        source={{ uri: url }}
        useNativeControls={false}
        resizeMode={ResizeMode.CONTAIN}
        isLooping
        isMuted={isMuted}
        posterSource={thumbnailUrl ? { uri: thumbnailUrl } : undefined}
        usePoster={!!thumbnailUrl}
        onPlaybackStatusUpdate={setStatus}
        onError={(e) => console.error('Video Playback Error:', e)}
      />
      <TouchableOpacity style={[styles.muteButton, isDetail && styles.muteButtonDetail]} onPress={toggleMute}>
        {isMuted ? (
          <VolumeX size={isDetail ? 20 : 18} color="#fff" />
        ) : (
          <Volume2 size={isDetail ? 20 : 18} color="#fff" />
        )}
      </TouchableOpacity>
      {(!isPlaying || didJustFinish) && (
        <TouchableOpacity style={styles.centerOverlay} onPress={toggle}>
          <View style={[styles.playButtonCircle, isDetail && styles.playButtonCircleDetail]}>
            {isDetail ? (
              <Play size={40} color="#fff" fill="#fff" />
            ) : (
              <Play size={32} color="#fff" fill="#fff" style={styles.playIcon} />
            )}
          </View>
        </TouchableOpacity>
      )}
      {isPlaying && <TouchableOpacity style={styles.fullOverlay} onPress={toggle} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 200,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    minHeight: 200,
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
    zIndex: 20,
  },
  muteButtonDetail: {
    bottom: 16,
    right: 16,
    padding: 10,
    borderRadius: 24,
  },
  centerOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
  },
  playButtonCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonCircleDetail: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  playIcon: {
    marginLeft: 4,
  },
});
