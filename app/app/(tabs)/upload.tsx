import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';
import {
  Upload,
  Video as VideoIcon,
  Music,
  FileText,
  Image as ImageIcon,
  X,
  PlayCircle,
  PauseCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ContentType } from '@/types';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { uploadMediaToCloudinary } from '@/utils/media';
import { apiCreatePost } from '@/utils/api';

type MediaFile = {
  uri: string;
  name: string;
  type?: string;
  size?: number;
};

export default function UploadScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { token } = useAuth();
  
  // State
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [mediaFile, setMediaFile] = useState<MediaFile | null>(null);
  const [caption, setCaption] = useState<string>('');
  const [roles, setRoles] = useState<string>('');
  const [industries, setIndustries] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Video Preview State
  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const resetForm = () => {
    setSelectedType(null);
    setMediaFile(null);
    setCaption('');
    setRoles('');
    setIndustries('');
    setUploading(false);
    setUploadProgress(0);
  };

  const handlePickMedia = async () => {
    try {
      if (selectedType === 'image' || selectedType === 'video') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission Required', 'Please allow access to your media library');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes:
            selectedType === 'video'
              ? ImagePicker.MediaTypeOptions.Videos
              : ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          quality: 0.8,
          aspect: selectedType === 'image' ? [4, 5] : undefined, // Social media aspect ratio
        });

        if (!result.canceled && result.assets[0]) {
          const asset = result.assets[0];
          setMediaFile({
            uri: asset.uri,
            name: asset.fileName || `upload.${selectedType === 'video' ? 'mp4' : 'jpg'}`,
            type: asset.mimeType || (selectedType === 'video' ? 'video/mp4' : 'image/jpeg'),
            size: asset.fileSize,
          });
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
      Alert.alert('Error', 'Failed to select media');
    }
  };

  const handleUpload = async () => {
    if (!selectedType || !mediaFile || !token) return;
    if (!caption.trim()) {
      Alert.alert('Required', 'Please add a caption');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // 1. Upload to Cloudinary
      const uploadResult = await uploadMediaToCloudinary(
        mediaFile,
        selectedType,
        token,
        (percent) => setUploadProgress(percent)
      );

      // 2. Create Post in Backend
      const rolesArray = roles.split(',').map(r => r.trim()).filter(Boolean);
      const industriesArray = industries.split(',').map(i => i.trim()).filter(Boolean);

      await apiCreatePost({
        type: selectedType,
        mediaUrl: uploadResult.url, // Legacy
        thumbnailUrl: uploadResult.thumbnail_url || uploadResult.url, // Legacy
        caption,
        roles: rolesArray,
        industries: industriesArray,
        // New Metadata structure
        media: {
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
      }, token);

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

  const uploadOptions = [
    { type: 'image' as ContentType, icon: ImageIcon, label: 'Image', color: '#4CAF50' },
    { type: 'video' as ContentType, icon: VideoIcon, label: 'Video', color: '#E91E63' },
    { type: 'audio' as ContentType, icon: Music, label: 'Audio', color: '#2196F3' },
    { type: 'script' as ContentType, icon: FileText, label: 'Script', color: '#FF9800' },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Create Post',
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
          <View style={styles.selectionContainer}>
            <Text style={[styles.heading, { color: colors.text }]}>What are you creating?</Text>
            <View style={styles.grid}>
              {uploadOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <TouchableOpacity
                    key={option.type}
                    style={[styles.optionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => setSelectedType(option.type)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: `${option.color}15` }]}>
                      <Icon size={32} color={option.color} />
                    </View>
                    <Text style={[styles.optionLabel, { color: colors.text }]}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.formContainer}>
             {/* Header */}
             <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.text }]}>
                  New {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                </Text>
                <TouchableOpacity onPress={resetForm} disabled={uploading}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
             </View>

            {/* Media Preview/Picker */}
            <View style={styles.mediaContainer}>
              {mediaFile ? (
                <View style={styles.previewWrapper}>
                  {selectedType === 'image' && (
                    <Image source={{ uri: mediaFile.uri }} style={styles.imagePreview} contentFit="cover" />
                  )}
                  {selectedType === 'video' && (
                    <Video
                      ref={videoRef}
                      source={{ uri: mediaFile.uri }}
                      style={styles.videoPreview}
                      resizeMode={ResizeMode.COVER}
                      isLooping
                      useNativeControls
                    />
                  )}
                  {(selectedType === 'audio' || selectedType === 'script') && (
                    <View style={[styles.filePreview, { backgroundColor: colors.surface }]}>
                      {selectedType === 'audio' ? <Music size={40} color={colors.primary} /> : <FileText size={40} color={colors.primary} />}
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {mediaFile.name}
                      </Text>
                      <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
                        {(mediaFile.size ? (mediaFile.size / 1024 / 1024).toFixed(2) : '0')} MB
                      </Text>
                    </View>
                  )}
                  
                  {!uploading && (
                    <TouchableOpacity 
                      style={[styles.changeMediaBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]} 
                      onPress={handlePickMedia}
                    >
                      <Text style={styles.changeMediaText}>Change</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.placeholder, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={handlePickMedia}
                >
                  <Upload size={40} color={colors.primary} />
                  <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    Tap to upload {selectedType}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Fields */}
            <View style={styles.inputs}>
              <Input
                label="Caption"
                placeholder="Write a caption..."
                value={caption}
                onChangeText={setCaption}
                multiline
                numberOfLines={4}
                style={{ height: 100, textAlignVertical: 'top' }}
                editable={!uploading}
              />
              
              <Input
                label="Roles (comma separated)"
                placeholder="e.g. Actor, Director"
                value={roles}
                onChangeText={setRoles}
                editable={!uploading}
              />

              <Input
                label="Industries (comma separated)"
                placeholder="e.g. Bollywood, Tollywood"
                value={industries}
                onChangeText={setIndustries}
                editable={!uploading}
              />
            </View>

            {/* Verify Button */}
            <Button
              title={uploading ? `Uploading ${uploadProgress}%` : 'Post'}
              onPress={handleUpload}
              loading={uploading}
              disabled={!mediaFile || !caption || uploading}
              size="large"
            />
            
            {uploading && (
                <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%`, backgroundColor: colors.primary }]} />
                </View>
            )}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  selectionContainer: { marginTop: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  optionCard: {
    width: '47%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 16, fontWeight: '600' },
  
  formContainer: { gap: 24 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formTitle: { fontSize: 22, fontWeight: 'bold' },
  
  mediaContainer: { width: '100%', aspectRatio: 16/9, borderRadius: 12, overflow: 'hidden' },
  previewWrapper: { width: '100%', height: '100%', position: 'relative' },
  imagePreview: { width: '100%', height: '100%' },
  videoPreview: { width: '100%', height: '100%' },
  placeholder: { 
    width: '100%', 
    height: '100%', 
    borderWidth: 2, 
    borderStyle: 'dashed', 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12 
  },
  placeholderText: { fontSize: 16 },
  
  inputs: { gap: 16 },
  
  filePreview: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fileName: { fontSize: 16, fontWeight: '600', paddingHorizontal: 20 },
  fileSize: { fontSize: 14 },
  
  changeMediaBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeMediaText: { color: 'white', fontSize: 12, fontWeight: '600' },
  
  progressBar: { height: 4, borderRadius: 2, width: '100%', marginTop: -10, overflow: 'hidden' },
  progressFill: { height: '100%' },
});
