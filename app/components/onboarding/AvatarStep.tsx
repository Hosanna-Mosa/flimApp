import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import AppText from '@/components/AppText';
import PresetAvatarRow from '@/components/onboarding/PresetAvatarRow';
import { CREW_AVATARS, ABSTRACT_AVATARS, PresetAvatar } from '@/constants/avatars';

interface AvatarStepProps {
  /** Gallery photo (local uri) or the default remote avatar. */
  avatar: string | null;
  presetAvatar: PresetAvatar | null;
  onPickImage: () => void;
  onPickPreset: (preset: PresetAvatar) => void;
  disabled?: boolean;
}

const SIZE = 150;

/** Step 1: big avatar preview with camera badge, plus the two preset carousels. */
export default function AvatarStep({
  avatar,
  presetAvatar,
  onPickImage,
  onPickPreset,
  disabled,
}: AvatarStepProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onPickImage} style={styles.avatarWrapper} disabled={disabled}>
        {presetAvatar ? (
          <View style={styles.avatarSvgWrapper}>
            <SvgXml xml={presetAvatar.svg} width={SIZE} height={SIZE} />
          </View>
        ) : avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Camera size={40} color={colors.textSecondary} />
          </View>
        )}
        <View
          style={[
            styles.editBadge,
            { backgroundColor: colors.primary, borderColor: colors.background },
          ]}
        >
          <Camera size={14} color={colors.onPrimary} />
        </View>
      </TouchableOpacity>
      <AppText variant="body" secondary style={styles.hint}>
        Tap the camera to upload your photo, or pick a ready-made avatar below.
      </AppText>

      <View style={styles.presets}>
        <PresetAvatarRow
          title="The Crew"
          avatars={CREW_AVATARS}
          selectedId={presetAvatar?.id}
          onSelect={onPickPreset}
          disabled={disabled}
        />
        <PresetAvatarRow
          title="Cinema Abstracts"
          avatars={ABSTRACT_AVATARS}
          selectedId={presetAvatar?.id}
          onSelect={onPickPreset}
          disabled={disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  avatarSvgWrapper: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  avatarPlaceholder: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  hint: {
    marginBottom: 24,
  },
  presets: {
    width: '100%',
    marginTop: 10,
  },
});
