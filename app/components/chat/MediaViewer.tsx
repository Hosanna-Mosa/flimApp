import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Download, Forward, Check } from 'lucide-react-native';
import { DirectMessageMedia } from './ChatMessageBubble';

interface MediaViewerProps {
  media: DirectMessageMedia | null;
  onClose: () => void;
  onForward?: (media: DirectMessageMedia) => void;
}

/**
 * Full-screen photo and video viewer.
 *
 * Always on a black ground regardless of theme: this covers the whole screen
 * and the surrounding app is irrelevant while it is open, so the media should
 * sit on the colour that flatters it rather than the one the app happens to
 * use.
 */
export default function MediaViewer({ media, onClose, onForward }: MediaViewerProps) {
  const insets = useSafeAreaInsets();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!media) return null;

  const isVideo = media.type === 'video';

  const save = async () => {
    setSaving(true);
    try {
      // Write-only permission: saving does not require the ability to read
      // someone's whole library, and iOS shows a narrower prompt for it.
      const { status } = await MediaLibrary.requestPermissionsAsync(true);
      if (status !== 'granted') {
        Alert.alert(
          'Permission needed',
          `Allow access to your ${isVideo ? 'videos' : 'photos'} so this can be saved.`
        );
        return;
      }

      const extension = isVideo ? 'mp4' : 'jpg';
      const target = `${FileSystem.cacheDirectory}filmy-${Date.now()}.${extension}`;

      const { uri } = await FileSystem.downloadAsync(media.url, target);
      await MediaLibrary.createAssetAsync(uri);

      setSaved(true);
      // Cleared so a second save is possible without reopening the viewer.
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('[chat] Save failed:', err);
      Alert.alert('Could not save', 'The file did not download. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent={false} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <View style={[styles.bar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} hitSlop={12} style={styles.barButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.barActions}>
            {onForward && (
              <TouchableOpacity
                onPress={() => {
                  // Close first: the forward sheet is another modal, and two
                  // stacked modals leave iOS showing neither.
                  onClose();
                  setTimeout(() => onForward(media), 260);
                }}
                hitSlop={12}
                style={styles.barButton}
              >
                <Forward size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={save} hitSlop={12} style={styles.barButton} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : saved ? (
                <Check size={22} color="#4ADE80" />
              ) : (
                <Download size={22} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={[
            styles.content,
            // Native video controls draw along the bottom edge of the video
            // itself. With the video filling the screen they land under the
            // home indicator and the gesture bar, where they cannot be
            // reliably tapped, so the video is inset by that much.
            isVideo ? { paddingBottom: insets.bottom + 16 } : null,
          ]}
        >
          {isVideo ? (
            <Video
              source={{ uri: media.url }}
              style={styles.media}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={false}
            />
          ) : (
            <Image
              source={{ uri: media.url }}
              style={styles.media}
              contentFit="contain"
              transition={150}
            />
          )}
        </View>

        {saved && (
          <View style={[styles.toast, { bottom: insets.bottom + 28 }]}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.toastText}>Saved to your {isVideo ? 'videos' : 'photos'}</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000000' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  barActions: { flexDirection: 'row', gap: 6 },
  barButton: { padding: 10 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  toast: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
});
