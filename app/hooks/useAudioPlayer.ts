import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { useMedia } from '@/contexts/MediaContext';

/**
 * expo-av sound playback for one post's audio: lazy-loads on first play,
 * tracks position/duration, and pauses itself when the screen blurs, when
 * another audio starts (MediaContext.currentPlayingAudioId), or when the
 * owning post scrolls out of view (`isActive === false`).
 */
export function useAudioPlayer(url: string | undefined, audioId: string, isActive?: boolean) {
  const { currentPlayingAudioId, setCurrentPlayingAudioId } = useMedia();
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  // Release the native sound when it changes or the owner unmounts.
  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  // Pause if another audio starts playing.
  useEffect(() => {
    if (currentPlayingAudioId !== audioId && isPlaying && sound) {
      sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [currentPlayingAudioId, isPlaying, sound, audioId]);

  // Pause when the screen loses focus (tab switch / navigate away).
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (isPlaying && sound) {
          sound.pauseAsync();
          setIsPlaying(false);
        }
      };
    }, [isPlaying, sound])
  );

  // Pause when the owning post is no longer the active one in a list.
  useEffect(() => {
    if (isActive === false && sound) {
      sound.pauseAsync();
      setIsPlaying(false);
    }
  }, [isActive, sound]);

  const toggle = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
          if (currentPlayingAudioId === audioId) setCurrentPlayingAudioId(null);
        } else {
          setCurrentPlayingAudioId(audioId);
          await sound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      setLoading(true);
      setCurrentPlayingAudioId(audioId);
      if (!url) {
        setLoading(false);
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
          setIsPlaying(status.isPlaying);
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
            newSound.setPositionAsync(0);
            setCurrentPlayingAudioId(null);
          }
        }
      );
      setSound(newSound);
      setLoading(false);
      setIsPlaying(true);
    } catch {
      setLoading(false);
    }
  };

  const seek = async (value: number) => {
    if (sound) await sound.setPositionAsync(value);
  };

  return { isLoaded: !!sound, isPlaying, position, duration, loading, toggle, seek };
}
