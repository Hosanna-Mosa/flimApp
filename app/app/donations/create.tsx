import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { X, Upload, Mic, Video as VideoIcon, Type, Check, Image as ImageIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import Button from '@/components/Button';
import { ContentType } from '@/types';

export default function CreateDonationScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token, user } = useAuth();

    const [isLoading, setIsLoading] = useState(false);
    const [caption, setCaption] = useState('');
    const [selectedType, setSelectedType] = useState<ContentType>('text');
    const [media, setMedia] = useState<ImagePicker.ImagePickerAsset | null>(null);

    const pickMedia = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: selectedType === 'video'
                    ? ImagePicker.MediaTypeOptions.Videos
                    : ImagePicker.MediaTypeOptions.Images, // Fallback, though we might want audio specific picker or just file picker
                allowsEditing: true,
                quality: 0.8,
                videoMaxDuration: 60,
            });

            if (!result.canceled && result.assets[0]) {
                setMedia(result.assets[0]);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick media');
        }
    };

    const handleUpload = async () => {
        if (!caption.trim() && !media) {
            Alert.alert('Error', 'Please add some content to your crowd fund request');
            return;
        }

        if ((selectedType === 'video' || selectedType === 'audio') && !media) {
            Alert.alert('Error', 'Please upload media for this post type');
            return;
        }

        setIsLoading(true);

        try {
            // 1. Upload media if needed (Using same logic as upload.tsx implied)
            let uploadedMediaUrl = '';
            let uploadedThumbnailUrl = '';
            let mediaMetadata = {};

            if (media && selectedType !== 'text') {
                const signatureRes = await api.getMediaSignature(selectedType, token!) as any;
                const { signature, timestamp, apiKey, cloudName, folder } = signatureRes;

                const formData = new FormData();
                formData.append('file', {
                    uri: media.uri,
                    name: media.fileName || `upload.${media.uri.split('.').pop()}`,
                    type: media.mimeType || (selectedType === 'video' ? 'video/mp4' : 'image/jpeg'),
                } as any);
                formData.append('api_key', apiKey);
                formData.append('timestamp', timestamp.toString());
                formData.append('signature', signature);
                formData.append('folder', folder);

                const uploadRes = await fetch(
                    `https://api.cloudinary.com/v1_1/${cloudName}/${selectedType === 'audio' ? 'video' : selectedType}/upload`,
                    {
                        method: 'POST',
                        body: formData,
                    }
                );

                const uploadData = await uploadRes.json();

                if (!uploadRes.ok) {
                    throw new Error(uploadData.error?.message || 'Upload failed');
                }

                uploadedMediaUrl = uploadData.secure_url;
                uploadedThumbnailUrl = uploadData.secure_url.replace(/\.[^/.]+$/, ".jpg"); // Simple approximation

                mediaMetadata = {
                    url: uploadedMediaUrl,
                    width: uploadData.width,
                    height: uploadData.height,
                    format: uploadData.format,
                    duration: uploadData.duration,
                    size: uploadData.bytes,
                    publicId: uploadData.public_id
                };
            }

            // 2. Create Post
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
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error: any) {
            console.error('Upload error:', error);
            Alert.alert('Upload Failed', error.message || 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const renderTypeSelector = () => (
        <View style={styles.typeContainer}>
            {(['text', 'image', 'video', 'audio'] as ContentType[]).map((type) => (
                <TouchableOpacity
                    key={type}
                    style={[
                        styles.typeButton,
                        selectedType === type && { backgroundColor: colors.primary },
                        { borderColor: colors.border }
                    ]}
                    onPress={() => {
                        setSelectedType(type);
                        setMedia(null);
                    }}
                >
                    {type === 'text' && <Type size={20} color={selectedType === type ? '#000' : colors.text} />}
                    {type === 'image' && <ImageIcon size={20} color={selectedType === type ? '#000' : colors.text} />}
                    {type === 'video' && <VideoIcon size={20} color={selectedType === type ? '#000' : colors.text} />}
                    {type === 'audio' && <Mic size={20} color={selectedType === type ? '#000' : colors.text} />}
                    <Text
                        style={[
                            styles.typeText,
                            { color: selectedType === type ? '#000' : colors.text }
                        ]}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Ask for Crowd Funding',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 0 }}>
                            <X size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
                <Text style={[styles.label, { color: colors.text }]}>Choose Format</Text>
                {renderTypeSelector()}

                {selectedType !== 'text' && (
                    <View style={styles.mediaSection}>
                        {media ? (
                            <View style={styles.previewContainer}>
                                {selectedType === 'video' ? (
                                    <Video
                                        source={{ uri: media.uri }}
                                        style={styles.mediaPreview}
                                        useNativeControls
                                        resizeMode={ResizeMode.COVER}
                                    />
                                ) : selectedType === 'image' ? (
                                    <Image
                                        source={{ uri: media.uri }}
                                        style={styles.mediaPreview}
                                        contentFit="cover"
                                    />
                                ) : (
                                    <View style={[styles.mediaPreview, { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surface }]}>
                                        <Mic size={48} color={colors.primary} />
                                        <Text style={{ color: colors.text, marginTop: 8 }}>Audio Selected</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.removeMedia}
                                    onPress={() => setMedia(null)}
                                >
                                    <X size={16} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.uploadBox, { borderColor: colors.border, backgroundColor: colors.card }]}
                                onPress={pickMedia}
                            >
                                <Upload size={32} color={colors.textSecondary} />
                                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                                    Upload {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <Text style={[styles.label, { color: colors.text, marginTop: 24 }]}>
                    {selectedType === 'text' ? 'Your Story' : 'Caption'}
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        {
                            color: colors.text,
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                            height: 150
                        }
                    ]}
                    placeholder="Tell people why you need support..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    textAlignVertical="top"
                    value={caption}
                    onChangeText={setCaption}
                />
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                <Button
                    title={isLoading ? 'Posting...' : 'Post Request'}
                    onPress={handleUpload}
                    disabled={isLoading}
                    style={{ width: '100%' }}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        gap: 8,
    },
    typeText: {
        fontWeight: '600',
        fontSize: 14,
    },
    mediaSection: {
        alignItems: 'center',
    },
    uploadBox: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '500',
    },
    previewContainer: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    mediaPreview: {
        width: '100%',
        height: '100%',
    },
    removeMedia: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 12,
    },
    input: {
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
});
