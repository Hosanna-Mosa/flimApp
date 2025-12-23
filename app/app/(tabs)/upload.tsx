import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import {
  Upload,
  Video,
  Music,
  FileText,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ContentType } from '@/types';
import Input from '@/components/Input';
import Button from '@/components/Button';

export default function UploadScreen() {
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [mediaUri, setMediaUri] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);

  const handlePickMedia = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes:
        selectedType === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
    }
  };

  const handleUpload = () => {
    if (!selectedType || !caption) {
      Alert.alert(
        'Missing Information',
        'Please select media type and add a caption'
      );
      return;
    }

    if ((selectedType === 'image' || selectedType === 'video') && !mediaUri) {
      Alert.alert('Missing Media', 'Please select a media file');
      return;
    }

    setUploading(true);
    setTimeout(() => {
      setUploading(false);
      Alert.alert('Success', 'Your content has been uploaded!');
      setSelectedType(null);
      setMediaUri('');
      setCaption('');
    }, 2000);
  };

  const uploadOptions = [
    {
      type: 'video' as ContentType,
      icon: Video,
      label: 'Upload Video',
      color: '#FF6B6B',
    },
    {
      type: 'audio' as ContentType,
      icon: Music,
      label: 'Upload Audio',
      color: '#4ECDC4',
    },
    {
      type: 'script' as ContentType,
      icon: FileText,
      label: 'Upload Script',
      color: '#FFD93D',
    },
    {
      type: 'image' as ContentType,
      icon: ImageIcon,
      label: 'Upload Image',
      color: '#A8E6CF',
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Upload',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!selectedType ? (
          <>
            <Text style={[styles.title, { color: colors.text }]}>
              What do you want to share?
            </Text>
            <View style={styles.optionsGrid}>
              {uploadOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[
                      styles.option,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => setSelectedType(option.type)}
                  >
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: `${option.color}20` },
                      ]}
                    >
                      <Icon size={32} color={option.color} />
                    </View>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : (
          <View style={styles.uploadForm}>
            <View
              style={[styles.typeHeader, { borderBottomColor: colors.border }]}
            >
              <Text style={[styles.typeTitle, { color: colors.text }]}>
                Uploading {selectedType}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSelectedType(null);
                  setMediaUri('');
                  setCaption('');
                }}
              >
                <Text style={[styles.changeButton, { color: colors.primary }]}>
                  Change
                </Text>
              </TouchableOpacity>
            </View>

            {(selectedType === 'image' || selectedType === 'video') && (
              <View style={styles.mediaSection}>
                {mediaUri ? (
                  <Image
                    source={{ uri: mediaUri }}
                    style={[
                      styles.preview,
                      { backgroundColor: colors.surface },
                    ]}
                    contentFit="cover"
                  />
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.mediaPicker,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={handlePickMedia}
                  >
                    <Upload size={48} color={colors.textSecondary} />
                    <Text
                      style={[
                        styles.pickerText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Tap to select {selectedType}
                    </Text>
                  </TouchableOpacity>
                )}
                {mediaUri && (
                  <Button
                    title="Change Media"
                    onPress={handlePickMedia}
                    variant="outline"
                  />
                )}
              </View>
            )}

            {selectedType === 'audio' && (
              <View
                style={[
                  styles.audioPlaceholder,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Music size={48} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Audio file selection (demo)
                </Text>
              </View>
            )}

            {selectedType === 'script' && (
              <View
                style={[
                  styles.scriptPlaceholder,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <FileText size={48} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.placeholderText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Script file selection (demo)
                </Text>
              </View>
            )}

            <Input
              label="Caption"
              placeholder="Write something about your work..."
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              style={styles.captionInput}
            />

            <Button
              title={uploading ? 'Uploading...' : 'Publish'}
              onPress={handleUpload}
              size="large"
              loading={uploading}
            />
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 24,
  },
  optionsGrid: {
    gap: 16,
  },
  option: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  uploadForm: {
    gap: 20,
  },
  typeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  changeButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  mediaSection: {
    gap: 12,
  },
  mediaPicker: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  pickerText: {
    fontSize: 16,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 16,
  },
  audioPlaceholder: {
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  scriptPlaceholder: {
    height: 150,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    fontSize: 14,
  },
  captionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
});
