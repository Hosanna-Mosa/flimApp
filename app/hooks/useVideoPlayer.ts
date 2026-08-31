import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Video, AVPlaybackStatus } from 'expo-av';

/**
 * Imperative control for one expo-av <Video>: play/pause toggle, playback
 * status, pause on screen blur, and (in lists) autoplay when the owning post
 * becomes active / pause when it scrolls away.
 */
export function useVideoPlayer(isActive?: boolean) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);

  const isPlaying = !!status?.isLoaded && status.isPlaying;
  const didJustFinish = !!status?.isLoaded && !!status.didJustFinish;

  // Pause when the screen loses focus (tab switch / navigate away).
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (videoRef.current) videoRef.current.pauseAsync();
      };
    }, [])
  );

  // Autoplay when this post becomes the active one, pause when it isn't.
  useEffect(() => {
    if (isActive === undefined || !videoRef.current) return;
    if (isActive) {
      videoRef.current.playAsync();
    } else {
      videoRef.current.pauseAsync();
    }
  }, [isActive]);

  const toggle = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  return { videoRef, isPlaying, didJustFinish, setStatus, toggle };
}
