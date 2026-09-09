import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import { uploadMediaToCloudinary } from '@/utils/media';
import { SharedFile } from '@/utils/shareIntent';

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

/**
 * Drops shared files the server would reject anyway, and says which.
 *
 * Files from the share sheet never went through the picker, so nothing has
 * checked them yet — and the limit is only enforced server-side, after the
 * whole upload has been spent.
 */
export function withinChatLimits(files: SharedFile[]): SharedFile[] {
  const kept = files.filter((f) => !f.size || f.size <= CHAT_LIMITS[f.kind]);
  const dropped = files.length - kept.length;

  if (dropped > 0) {
    Alert.alert(
      dropped === files.length ? 'Too large to send' : 'Some files were skipped',
      `${dropped} of ${files.length} ${files.length === 1 ? 'file is' : 'files are'} over the ` +
        `${mb(CHAT_LIMITS.image)} MB photo / ${mb(CHAT_LIMITS.video)} MB video limit.`
    );
  }
  return kept;
}

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
  /**
   * The rest of a multi-file share. The composer holds one attachment at a
   * time, so several shared photos are sent as several messages, each one
   * moving into `pending` as the previous is sent.
   */
  const [queue, setQueue] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  /** Position of the file currently uploading within a queued batch. */
  const [uploadIndex, setUploadIndex] = useState(0);

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

  /** Stages files handed over by the OS share sheet, ready for the user to send. */
  const stageExternal = (files: SharedFile[]) => {
    const withinLimit = withinChatLimits(files);
    if (withinLimit.length === 0) return;

    const staged: PendingAttachment[] = withinLimit.map((f) => ({
      uri: f.uri,
      kind: f.kind,
      name: f.name,
      size: f.size,
      width: f.width,
      height: f.height,
      duration: f.duration,
    }));

    setPending(staged[0]);
    setQueue(staged.slice(1));
    setProgress(0);
  };

  const clear = () => {
    setPending(null);
    setQueue([]);
    setProgress(0);
  };

  /** Swaps in the cropped file, keeping everything else about the pick. */
  const applyCrop = (uri: string, width: number, height: number) =>
    setPending((prev) =>
      prev ? { ...prev, uri, width, height, wantsCrop: false, size: undefined } : prev
    );

  const uploadOne = async (file: PendingAttachment): Promise<UploadedAttachment> => {
    const result = await uploadMediaToCloudinary(
      { uri: file.uri, name: file.name, size: file.size },
      file.kind,
      token!,
      setProgress
    );

    return {
      url: result.url,
      type: file.kind,
      // Cloudinary's upload response has no thumbnail_url field — asking for
      // one always yielded undefined, and the bubble then fell back to the
      // .mp4, which an image view cannot render. A poster frame is derived
      // from the video URL instead: swapping the extension makes Cloudinary
      // return the first frame as a still.
      thumbnail: file.kind === 'video' ? posterFrameFor(result.url) : undefined,
      publicId: result.publicId,
      size: result.bytes || file.size,
      width: result.width || file.width,
      height: result.height || file.height,
      duration: result.duration || file.duration,
    };
  };

  /** Uploads the pending file and returns what the message should carry. */
  const upload = async (): Promise<UploadedAttachment | null> => {
    if (!pending || !token) return null;

    setUploading(true);
    setProgress(0);
    try {
      return await uploadOne(pending);
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

  /**
   * Uploads the pending file and everything queued behind it, in order.
   *
   * All or nothing: one failure abandons the batch rather than sending a
   * partial set, because the files came from a single share and the sender
   * would have no way to tell which of them made it.
   */
  const uploadAll = async (): Promise<UploadedAttachment[] | null> => {
    if (!pending || !token) return null;
    const files = [pending, ...queue];

    setUploading(true);
    setProgress(0);
    try {
      const uploaded: UploadedAttachment[] = [];
      for (const file of files) {
        setPending(file);
        setUploadIndex(uploaded.length);
        setProgress(0);
        uploaded.push(await uploadOne(file));
      }
      return uploaded;
    } catch (err) {
      console.error('[chat] Attachment upload failed:', err);
      Alert.alert(
        files.length > 1 ? 'Could not send these files' : 'Could not send',
        'The attachment did not upload. Check your connection and try again.'
      );
      return null;
    } finally {
      setUploading(false);
      setUploadIndex(0);
      // The loop walks `pending` through the batch; put it back so a failed
      // batch is still shown from the top, with nothing lost from the composer.
      setPending(files[0]);
    }
  };

  return {
    pending,
    /** How many more files follow the one in the composer. */
    remaining: queue.length,
    /** Which file of the batch is uploading, 0-based. */
    uploadIndex,
    uploading,
    progress,
    pick,
    stageExternal,
    clear,
    upload,
    uploadAll,
    applyCrop,
  };
}
