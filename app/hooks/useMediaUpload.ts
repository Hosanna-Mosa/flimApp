import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth } from '@/contexts/AuthContext';
import { ContentType } from '@/types';
import { uploadMediaToCloudinary, CloudinaryResponse } from '@/utils/media';
import { api, apiCreatePost } from '@/utils/api';

export interface MediaFile {
  uri: string;
  name: string;
  type?: string;
  size?: number;
}

interface UseMediaUploadOptions {
  /** Crowd Fund request: 4-way selector, `isDonation: true` post, back on success. */
  isDonation?: boolean;
  /** Type pre-selected when the screen opens (Crowd Fund starts on 'text'). */
  initialType?: ContentType | null;
}

const EMPTY_UPLOAD: CloudinaryResponse = {
  url: '',
  thumbnail_url: '',
  duration: 0,
  format: '',
  bytes: 0,
  width: 0,
  height: 0,
  pages: 0,
  publicId: '',
};

/**
 * Everything behind "pick a file, upload it to Cloudinary, create the post":
 * picker permissions, image/video vs document picker, upload progress and
 * the createPost call. Used by Create Post and Ask for Crowd Funding.
 */
export function useMediaUpload({ isDonation = false, initialType = null }: UseMediaUploadOptions = {}) {
  const router = useRouter();
  const { token } = useAuth();

  const [selectedType, setSelectedType] = useState<ContentType | null>(initialType);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [caption, setCaption] = useState('');
  const [roles, setRoles] = useState('');
  const [industries, setIndustries] = useState('');
  const [uploading, setUploading] = useState(false);
  /** Picked but not yet accepted, while the crop tool is open. */
  const [cropTarget, setCropTarget] = useState<{
    file: MediaFile;
    width?: number;
    height?: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const selectType = (type: ContentType | null) => {
    setSelectedType(type);
    setMediaFile(null);
  };

  const removeMedia = () => setMediaFile(null);

  /** The crop tool finished, or was cancelled with the picture as taken. */
  const finishCrop = (uri: string) => {
    setCropTarget((target) => {
      if (target) setMediaFile({ ...target.file, uri, size: undefined });
      return null;
    });
  };

  const resetForm = () => {
    setSelectedType(initialType);
    setMediaFile(null);
    setCaption('');
    setRoles('');
    setIndustries('');
    setUploading(false);
    setUploadProgress(0);
  };

  const pickMedia = async () => {
    try {
      if (selectedType === 'image' || selectedType === 'video') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your media library');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          // The array form, not MediaTypeOptions — that enum is deprecated in
          // expo-image-picker 17 and no longer selects the video source.
          mediaTypes: selectedType === 'video' ? ['videos'] : ['images'],
          // Photos go to the app's own crop tool. The system one was being
          // given aspect [4,5], and a fixed ratio is exactly what reduces the
          // Android frame to corner-only handles and locks iOS to a square —
          // so every posted photo was forced to 4:5 with no say in it. Video
          // still uses the system trimmer, which has no such problem.
          allowsEditing: selectedType === 'video',
          quality: 0.8,
          videoMaxDuration: isDonation ? 60 : undefined,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          const file = {
            uri: asset.uri,
            name: asset.fileName || `upload.${selectedType === 'video' ? 'mp4' : 'jpg'}`,
            type: asset.mimeType || (selectedType === 'video' ? 'video/mp4' : 'image/jpeg'),
            size: asset.fileSize,
          };

          if (selectedType === 'image') {
            setCropTarget({ file, width: asset.width, height: asset.height });
            return;
          }

          setMediaFile(file);
        }
      } else if (selectedType === 'audio' || selectedType === 'script') {
        const type = selectedType === 'audio' ? 'audio/*' : '*/*';
        const result = await DocumentPicker.getDocumentAsync({
          type,
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setMediaFile({
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType || (selectedType === 'audio' ? 'audio/mpeg' : 'application/pdf'),
            size: asset.size,
          });
        }
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', isDonation ? 'Failed to pick media' : 'Failed to select media');
    }
  };

  const validate = (): boolean => {
    if (isDonation) {
      if (!caption.trim() && !mediaFile) {
        Alert.alert('Error', 'Please add some content to your crowd fund request');
        return false;
      }
      if ((selectedType === 'video' || selectedType === 'audio') && !mediaFile) {
        Alert.alert('Error', 'Please upload media for this post type');
        return false;
      }
      return true;
    }

    if (!selectedType || (!mediaFile && selectedType !== 'text') || !token) return false;
    if (!caption.trim()) {
      Alert.alert('Required', selectedType === 'text' ? 'Please write something' : 'Please add a caption');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!selectedType || !validate()) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      let uploadResult: CloudinaryResponse = EMPTY_UPLOAD;

      // 1. Upload to Cloudinary (only if not text)
      if (selectedType !== 'text' && mediaFile) {
        uploadResult = await uploadMediaToCloudinary(
          mediaFile,
          selectedType,
          token!,
          (percent) => setUploadProgress(percent)
        );
      }

      // 2. Create Post in Backend
      if (isDonation) {
        const hasMedia = selectedType !== 'text' && !!mediaFile;
        const uploadedMediaUrl = hasMedia ? uploadResult.url : '';
        const uploadedThumbnailUrl = hasMedia
          ? uploadResult.thumbnail_url || uploadResult.url.replace(/\.[^/.]+$/, '.jpg')
          : '';
        const mediaMetadata = hasMedia
          ? {
              url: uploadedMediaUrl,
              width: uploadResult.width,
              height: uploadResult.height,
              format: uploadResult.format,
              duration: uploadResult.duration,
              size: uploadResult.bytes,
              publicId: uploadResult.publicId,
            }
          : {};

        await api.createPost({
          type: selectedType,
          caption,
          mediaUrl: uploadedMediaUrl,
          thumbnail: uploadedThumbnailUrl,
          media: mediaMetadata,
          isDonation: true, // IMPORTANT FLAG
          roles: [],
          industries: [],
        }, token!);

        Alert.alert('Success', 'Crowd Fund request posted!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      const rolesArray = roles.split(',').map((r) => r.trim()).filter(Boolean);
      const industriesArray = industries.split(',').map((i) => i.trim()).filter(Boolean);

      await apiCreatePost({
        type: selectedType,
        mediaUrl: uploadResult.url || '', // Handle empty for text
        thumbnailUrl: uploadResult.thumbnail_url || uploadResult.url || '',
        caption,
        roles: rolesArray,
        industries: industriesArray,
        // New Metadata structure
        media: selectedType === 'text' ? undefined : {
          url: uploadResult.url,
          thumbnail: uploadResult.thumbnail_url,
          duration: uploadResult.duration,
          format: uploadResult.format,
          size: uploadResult.bytes,
          width: uploadResult.width,
          height: uploadResult.height,
          pages: uploadResult.pages,
          publicId: uploadResult.publicId,
        },
        duration: uploadResult.duration,
        size: uploadResult.bytes,
        format: uploadResult.format,
      }, token!);

      Alert.alert('Success', 'Post created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            router.push('/(tabs)/home');
          },
        },
      ]);
    } catch (error: any) {
      console.error('Upload failed:', error);
      Alert.alert('Upload Failed', error.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return {
    cropTarget,
    finishCrop,
    selectedType,
    selectType,
    mediaFile,
    pickMedia,
    removeMedia,
    caption,
    setCaption,
    roles,
    setRoles,
    industries,
    setIndustries,
    uploading,
    uploadProgress,
    submit,
    resetForm,
  };
}
