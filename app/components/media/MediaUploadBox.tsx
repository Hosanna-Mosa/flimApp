import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Upload, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ContentType } from '@/types';
import { MediaFile } from '@/hooks/useMediaUpload';
import FilePreviewCard from '@/components/media/FilePreviewCard';

interface MediaUploadBoxProps {
  type: ContentType;
  file: MediaFile | null;
  /** Opens the picker (empty placeholder tap, and the "Change" pill). */
  onPick: () => void;
  /** When set, an X button in the corner clears the selection. */
  onRemove?: () => void;
  /** Hides Change/Remove while an upload is in flight. */
  disabled?: boolean;
  /** Placeholder copy; defaults to "Tap to upload {type}". */
  placeholderLabel?: string;
  /** Fixed height; when omitted the box is a 16:9 block. */
  height?: number;
}

/**
 * The media slot of a create-post form: the dashed "tap to upload" target
 * when empty, otherwise an image / video / file preview with Change and
 * (optionally) Remove controls.
 */
export default function MediaUploadBox({
  type,
  file,
  onPick,
  onRemove,
  disabled,
  placeholderLabel,
  height,
}: MediaUploadBoxProps) {
  const { colors } = useTheme();
  const sizeStyle = height ? { height } : styles.widescreen;
  // The overlay token is translucent black in both themes, so its foreground
  // is always white (there is no "onOverlay" token).
  const onOverlay = '#FFFFFF';

  if (!file) {
    return (
      <TouchableOpacity
        style={[
          styles.container,
          sizeStyle,
          styles.placeholder,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        onPress={onPick}
        disabled={disabled}
      >
        <Upload size={40} color={colors.primary} />
        <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
          {placeholderLabel ?? `Tap to upload ${type}`}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, sizeStyle]}>
      {type === 'image' && (
        <Image source={{ uri: file.uri }} style={styles.fill} contentFit="cover" />
      )}
      {type === 'video' && (
        <Video
          source={{ uri: file.uri }}
          style={styles.fill}
          resizeMode={ResizeMode.COVER}
          isLooping
          useNativeControls
        />
      )}
      {(type === 'audio' || type === 'script') && (
        <FilePreviewCard type={type} name={file.name} size={file.size} />
      )}

      {!disabled && (
        <TouchableOpacity
          style={[styles.changeButton, { backgroundColor: colors.overlay }]}
          onPress={onPick}
        >
          <Text style={[styles.changeText, { color: onOverlay }]}>Change</Text>
        </TouchableOpacity>
      )}
      {!disabled && onRemove && (
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.overlay }]}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={onOverlay} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  widescreen: { aspectRatio: 16 / 9 },
  fill: { width: '100%', height: '100%' },
  placeholder: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: { fontSize: 16 },
  changeButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeText: { fontSize: 12, fontWeight: '600' },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 6,
    borderRadius: 12,
  },
});
