import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { Image } from 'expo-image';
import { Play, Music, FileText, Film, Type, Plus, HandCoins } from 'lucide-react-native';
import { TrendingSkeleton } from '@/components/skeletons/TrendingSkeleton';

export default function DonationsScreen() {
    const { colors } = useTheme();
    const { token } = useAuth();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDonations = async () => {
        try {
            const response = await api.getDonations(0, 20, token || undefined) as any;
            if (response) {
                // Map backend posts (handle both array directly or response object)
                const data = Array.isArray(response) ? response : (response.data || []);

                const mappedPosts = data.map((post: any) => ({
                    id: post._id,
                    thumbnailUrl: post.thumbnailUrl,
                    mediaUrl: post.mediaUrl,
                    caption: post.caption,
                    type: post.type,
                    author: post.author,
                    likes: post.engagement?.likesCount || 0,
                }));
                setPosts(mappedPosts);
            }
        } catch (error) {
            console.error('Error fetching donation posts:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDonations();
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchDonations();
    };

    const renderMediaIcon = (type: string) => {
        const iconProps = { size: 20, color: colors.primary };
        switch (type) {
            case 'video':
                return <Play {...iconProps} />;
            case 'audio':
                return <Music {...iconProps} />;
            case 'script':
                return <FileText {...iconProps} />;
            case 'text':
                return <Type {...iconProps} />;
            default:
                return <Film {...iconProps} />;
        }
    };

    return (
        <SafeAreaView
            style={[styles.container, { backgroundColor: colors.background }]}
            edges={['bottom', 'left', 'right']}
        >
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: 'Donations',
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={{
                    paddingBottom: Platform.OS === 'android' ? Math.max(insets.bottom, 80) : 80, // Extra padding for FAB
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                <View style={styles.header}>
                    <HandCoins size={32} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Support Content
                    </Text>
                </View>

                {isLoading ? (
                    <View>
                        {[1, 2, 3, 4, 5].map(i => <TrendingSkeleton key={i} />)}
                    </View>
                ) : posts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No donation requests yet. Be the first!
                        </Text>
                    </View>
                ) : (
                    posts.map((post, index) => (
                        <TouchableOpacity
                            key={post.id}
                            style={[
                                styles.item,
                                { backgroundColor: colors.card, borderColor: colors.border },
                            ]}
                            onPress={() => router.push(`/post/${post.id}`)}
                        >
                            {post.type === 'text' ? (
                                <View style={[styles.textPreview, { backgroundColor: colors.surface }]}>
                                    <Text style={{ color: colors.text }} numberOfLines={3}>{post.caption}</Text>
                                    <Type size={24} color={colors.textSecondary} style={{ position: 'absolute', bottom: 8, right: 8 }} />
                                </View>
                            ) : (
                                <Image
                                    source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                                    style={styles.thumbnail}
                                    contentFit="cover"
                                />
                            )}

                            <View style={styles.info}>
                                <Text
                                    style={[styles.caption, { color: colors.text }]}
                                    numberOfLines={2}
                                >
                                    {post.caption || 'No caption'}
                                </Text>

                                <View style={styles.authorRow}>
                                    <Image source={{ uri: post.author?.avatar }} style={styles.avatar} />
                                    <Text style={[styles.authorName, { color: colors.textSecondary }]}>{post.author?.name}</Text>
                                </View>

                                <View style={styles.meta}>
                                    {renderMediaIcon(post.type)}
                                    <Text style={[styles.likes, { color: colors.textSecondary }]}>
                                        {post.likes} Likes
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: colors.primary, bottom: Platform.OS === 'android' ? Math.max(insets.bottom, 24) : 24 }]}
                onPress={() => router.push('/donations/create')}
                activeOpacity={0.8}
            >
                <Plus size={32} color="#000000" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold'
    },
    item: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        height: 120
    },
    thumbnail: {
        width: 120,
        height: '100%'
    },
    textPreview: {
        width: 120,
        height: '100%',
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    info: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between'
    },
    caption: {
        fontSize: 16,
        fontWeight: '600'
    },
    authorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    avatar: {
        width: 20,
        height: 20,
        borderRadius: 10
    },
    authorName: {
        fontSize: 12
    },
    meta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    likes: {
        fontSize: 14
    },
    emptyState: {
        padding: 40,
        alignItems: 'center'
    },
    emptyText: {
        fontSize: 16
    },
    fab: {
        position: 'absolute',
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 100,
    }
});
