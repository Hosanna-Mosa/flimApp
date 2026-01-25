import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Image,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, X, Send } from 'lucide-react-native';
import api from '@/utils/api';

export default function SupportScreen() {
    const router = useRouter();
    const { colors } = useTheme();
    const { token } = useAuth();
    const [reason, setReason] = useState('');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0]) {
                setImageUri(result.assets[0].uri);
                setImageBase64(result.assets[0].base64 || null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const removeImage = () => {
        setImageUri(null);
        setImageBase64(null);
    };

    const handleSubmit = async () => {
        if (!reason.trim()) {
            Alert.alert('Error', 'Please enter a reason for your support request');
            return;
        }

        if (!token) {
            Alert.alert('Error', 'You must be logged in to submit a support request');
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                reason: reason.trim(),
                imageUrl: imageBase64 ? 'data:image/jpeg;base64,' + imageBase64 : null,
            };

            await api.createSupportRequest(payload, token);

            Alert.alert(
                'Success',
                'Your support request has been submitted successfully.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Support submission error:', error);
            Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Support',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: colors.background }]}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={[styles.inputContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.label, { color: colors.text }]}>Reason for Contact</Text>
                        <TextInput
                            style={[styles.textInput, { color: colors.text }]}
                            placeholder="Describe your issue or feedback..."
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={6}
                            value={reason}
                            onChangeText={setReason}
                            textAlignVertical="top"
                        />
                    </View>

                    <View style={styles.imageSection}>
                        <Text style={[styles.label, { color: colors.text, marginBottom: 12 }]}>Attachment (Optional)</Text>

                        {imageUri ? (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                                <TouchableOpacity
                                    style={[styles.removeImageBtn, { backgroundColor: colors.error || '#FF4444' }]}
                                    onPress={removeImage}
                                >
                                    <X size={20} color="#FFFFFF" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={[styles.uploadBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                onPress={pickImage}
                            >
                                <Upload size={32} color={colors.primary} />
                                <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                                    Upload Screenshot
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>

                <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            { backgroundColor: colors.primary, opacity: isLoading || !reason.trim() ? 0.7 : 1 },
                        ]}
                        onPress={handleSubmit}
                        disabled={isLoading || !reason.trim()}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <>
                                <Send size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                                <Text style={styles.submitBtnText}>Submit Request</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
    inputContainer: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    textInput: {
        fontSize: 16,
        minHeight: 120,
    },
    imageSection: {
        marginBottom: 24,
    },
    uploadBtn: {
        height: 160,
        borderRadius: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '500',
    },
    imagePreviewContainer: {
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
    },
    imagePreview: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        resizeMode: 'cover',
    },
    removeImageBtn: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
    },
    submitBtn: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    submitBtnText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});
