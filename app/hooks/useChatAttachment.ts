import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaToCloudinary } from '@/utils/media';

/** Mirrors MediaService.SIZE_LIMITS on the server, which rejects anything larger. */
export const CHAT_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
};

const mb = (bytes: number) => Math.round(bytes / (1024 * 1024));

/**
 * A still from the first frame of a Cloudinary video.
 *
 * Cloudinary renders one on demand when the extension is an image format, so
 * .../video/upload/v1/clip.mp4 becomes .../video/upload/so_0/v1/clip.jpg.
 * so_0 pins it to the opening frame; without it Cloudinary picks its own and
 * the same video can show a different poster between requests.
 */
export const posterFrameFor = (videoUrl: string): string | undefined => {
  if (!videoUrl.includes('/video/upload/')) return undefined;
  return videoUrl
    .replace('/video/upload/', '/video/upload/so_0/')
    .replace(/\.[a-z0-9]+$/i, '.jpg');
};

export interface PendingAttachment {
  uri: string;
  kind: 'image' | 'video';
  /** The crop tool should open for this one before it is sent. */
  wantsCrop?: boolean;
  name: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

export interface UploadedAttachment {
  url: string;
  type: 'image' | 'video';
  thumbnail?: string;
  publicId?: string;
  size?: number;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Picking and uploading a chat attachment.
 *
 * Size is checked before the upload starts rather than after. Sending 100MB
 * over a phone connection and only then being told it was too large wastes the
 * upload, the data allowance and several minutes of the sender's time.
 */
export function useChatAttachment() {
  const { token } = useAuth();
  const [pending, setPending] = useState<PendingAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * @param edit Opens the system crop tool for a photo, or the trim tool for a
   *   video. Off by default and offered as a separate choice rather than always
   *   on, because iOS forces a square crop — `aspect` is Android-only — so
   *   enabling it for everyone would quietly square every portrait photo.
   */
  const pick = async (kind: 'image' | 'video', edit = false) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permission needed',
        `Allow access to your ${kind === 'video' ? 'videos' : 'photos'} to attach one.`
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      // The array form, not MediaTypeOptions — that enum is deprecated in
      // expo-image-picker 17 and choosing Video still opened the photo picker.
      mediaTypes: kind === 'video' ? ['videos'] : ['images'],
      quality: kind === 'image' ? 0.8 : undefined,
      // The system cropper is deliberately not used for photos. It is a
      // draggable rectangle over a fixed picture, and on iOS that rectangle is
      // locked to a square — ImageCropper replaces it with a fixed frame the
      // picture moves behind, which is the interaction people know. Video
      // still uses the system trimmer, which has no equivalent problem.
      allowsEditing: kind === 'video' ? edit : false,
    });

    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    const limit = CHAT_LIMITS[kind];

    if (asset.fileSize && asset.fileSize > limit) {
      Alert.alert(
        `${kind === 'video' ? 'Video' : 'Photo'} is too large`,
        `This one is ${mb(asset.fileSize)} MB and the limit is ${mb(limit)} MB. ` +
          `Pick a ${kind === 'video' ? 'shorter clip' : 'smaller photo'}, or compress it first.`
      );
      return;
    }

    setPending({
      uri: asset.uri,
      /** Set when the picker was opened via the crop option. */
      wantsCrop: kind === 'image' && edit,
      kind,
      name: asset.fileName || (kind === 'video' ? 'video.mp4' : 'photo.jpg'),
      size: asset.fileSize ?? undefined,
      width: asset.width,
      height: asset.height,
      duration: asset.duration ?? undefined,
    });
  };

  const clear = () => {
    setPending(null);
    setProgress(0);
  };

  /** Swaps in the cropped file, keeping everything else about the pick. */
  const applyCrop = (uri: string, width: number, height: number) =>
    setPending((prev) =>
      prev ? { ...prev, uri, width, height, wantsCrop: false, size: undefined } : prev
    );

  /** Uploads the pending file and returns what the message should carry. */
  const upload = async (): Promise<UploadedAttachment | null> => {
    if (!pending || !token) return null;

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadMediaToCloudinary(
        { uri: pending.uri, name: pending.name, size: pending.size },
        pending.kind,
        token,
        setProgress
      );

      return {
        url: result.url,
        type: pending.kind,
        // Cloudinary's upload response has no thumbnail_url field — asking for
        // one always yielded undefined, and the bubble then fell back to the
        // .mp4, which an image view cannot render. A poster frame is derived
        // from the video URL instead: swapping the extension makes Cloudinary
        // return the first frame as a still.
        thumbnail:
          pending.kind === 'video' ? posterFrameFor(result.url) : undefined,
        publicId: result.publicId,
        size: result.bytes || pending.size,
        width: result.width || pending.width,
        height: result.height || pending.height,
        duration: result.duration || pending.duration,
      };
    } catch (err) {
      console.error('[chat] Attachment upload failed:', err);
      Alert.alert(
        'Could not send',
        'The attachment did not upload. Check your connection and try again.'
      );
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pending, uploading, progress, pick, clear, upload, applyCrop };
}
