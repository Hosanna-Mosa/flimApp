import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
    MapPin,
    Briefcase,
    Grid3x3,
    Video,
    Music,
    FileText,
    Image as ImageIcon,
    Check,
    Plus,
    BadgeCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { ContentType } from '@/types';

interface UserProfile {
    _id: string;
    name: string;
    avatar: string;
    bio?: string;
    roles: string[];
    industries?: string[];
    location?: string;
    experience?: number;
    isVerified: boolean;
    stats: {
        followersCount: number;
        followingCount: number;
        postsCount: number;
    };
}

interface UserPost {
    _id: string;
    type: ContentType;
    mediaUrl: string;
    thumbnailUrl?: string;
    caption?: string;
}

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { colors } = useTheme();
    const { token } = useAuth();
    const router = useRouter();
    
    const [selectedFilter, setSelectedFilter] = useState<ContentType | 'all'>('all');
    const [isFollowing, setIsFollowing] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<UserPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && token) {
            loadUserProfile();
        }
    }, [id, token]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);
            const [userData, postsData] = await Promise.all([
                api.user(id, token),
                api.getUserFeed(id, 0, 100, token),
            ]);
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUser(userData as any);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPosts((postsData as any).data || []);
            
            // Check if already following
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const followStatus: any = await api.isFollowing(id, token);
                console.log('[UserProfile] Follow status response:', JSON.stringify(followStatus));
                // Handle both {following: true} and {data: {following: true}} formats
                const isFollowingValue = followStatus?.following ?? followStatus?.data?.following ?? false;
                console.log('[UserProfile] Is following:', isFollowingValue);
                setIsFollowing(isFollowingValue === true);
            } catch (followError) {
                console.error('[UserProfile] Error checking follow status:', followError);
                setIsFollowing(false);
            }
        } catch (error) {
            console.error('[UserProfile] Error loading:', error);
            Alert.alert('Error', 'Failed to load user profile');
        } finally {
            setLoading(false);
        }
    };

    const toggleFollow = async () => {
        if (!user) return;
        
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            
            const wasFollowing = isFollowing;
            setIsFollowing(!wasFollowing);

            // Optimistically update follower count
            setUser({
                ...user,
                stats: {
                    ...user.stats,
                    followersCount: wasFollowing 
                        ? user.stats.followersCount - 1 
                        : user.stats.followersCount + 1,
                },
            });

            if (wasFollowing) {
                await api.unfollowUser(id, token);
            } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const result: any = await api.followUser(id, token);
                if (result.status === 'pending') {
                    Alert.alert('Follow Request Sent', 'This account is private. Your request is pending.');
                    // Revert if pending
                    setIsFollowing(false);
                    setUser({
                        ...user,
                        stats: {
                            ...user.stats,
                            followersCount: user.stats.followersCount - 1,
                        },
                    });
                }
            }
        } catch (error) {
            // Revert on error
            setIsFollowing(!isFollowing);
            if (user) {
                setUser({
                    ...user,
                    stats: {
                        ...user.stats,
                        followersCount: isFollowing 
                            ? user.stats.followersCount + 1 
                            : user.stats.followersCount - 1,
                    },
                });
            }
            console.error('[UserProfile] Follow error:', error);
            Alert.alert('Error', 'Failed to update follow status');
        }
    };

    const filteredPosts = selectedFilter === 'all'
        ? posts
        : posts.filter((post) => post.type === selectedFilter);

    const filters = [
        { id: 'all' as const, label: 'All', icon: Grid3x3 },
        { id: 'video' as ContentType, label: 'Videos', icon: Video },
        { id: 'audio' as ContentType, label: 'Audio', icon: Music },
        { id: 'image' as ContentType, label: 'Images', icon: ImageIcon },
        { id: 'script' as ContentType, label: 'Scripts', icon: FileText },
    ];

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: 'Profile',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </View>
        );
    }

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Stack.Screen
                    options={{
                        headerShown: true,
                        headerTitle: 'Profile',
                        headerStyle: { backgroundColor: colors.background },
                        headerTintColor: colors.text,
                    }}
                />
                <View style={styles.loadingContainer}>
                    <Text style={{ color: colors.text }}>User not found</Text>
                </View>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: user.name,
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                }}
            />
            <ScrollView
                style={[styles.container, { backgroundColor: colors.background }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Image
                        source={{ uri: user.avatar }}
                        style={styles.avatar}
                        contentFit="cover"
                    />
                    <View style={styles.nameContainer}>
                        <Text style={[styles.name, { color: colors.text }]}>
                            {user.name}
                        </Text>
                        {user.isVerified && (
                            <BadgeCheck size={24} color={colors.primary} fill="transparent" />
                        )}
                    </View>

                    <View style={styles.rolesContainer}>
                        {user.roles.map((role, idx) => (
                            <View
                                key={idx}
                                style={[styles.roleBadge, { backgroundColor: colors.surface }]}
                            >
                                <Text style={[styles.roleText, { color: colors.text }]}>
                                    {role}
                                </Text>
                            </View>
                        ))}
                    </View>
                    <Text style={[styles.bio, { color: colors.textSecondary }]}>
                        {user.bio || 'No bio available'}
                    </Text>

                    <View style={styles.info}>
                        {user.location && (
                            <View style={styles.infoRow}>
                                <MapPin size={16} color={colors.textSecondary} />
                                <Text
                                    style={[styles.infoText, { color: colors.textSecondary }]}
                                >
                                    {user.location}
                                </Text>
                            </View>
                        )}
                        {user.experience && user.experience > 0 && (
                            <View style={styles.infoRow}>
                                <Briefcase size={16} color={colors.textSecondary} />
                                <Text
                                    style={[styles.infoText, { color: colors.textSecondary }]}
                                >
                                    {user.experience} years experience
                                </Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.followButton,
                            {
                                backgroundColor: isFollowing ? colors.surface : colors.primary,
                                borderColor: isFollowing ? colors.border : colors.primary,
                            },
                        ]}
                        onPress={toggleFollow}
                    >
                        {isFollowing ? (
                            <Check size={20} color={colors.text} />
                        ) : (
                            <Plus size={20} color="#fff" />
                        )}
                        <Text style={[styles.followButtonText, { color: isFollowing ? colors.text : '#fff' }]}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {user.stats.postsCount || posts.length}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Posts
                            </Text>
                        </View>
                        <View
                            style={[styles.statDivider, { backgroundColor: colors.border }]}
                        />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {user.stats.followersCount || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Followers
                            </Text>
                        </View>
                        <View
                            style={[styles.statDivider, { backgroundColor: colors.border }]}
                        />
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {user.stats.followingCount || 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Following
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.filters, { borderBottomColor: colors.border }]}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {filters.map((filter) => {
                            const Icon = filter.icon;
                            return (
                                <TouchableOpacity
                                    key={filter.id}
                                    style={[
                                        styles.filter,
                                        selectedFilter === filter.id && {
                                            borderBottomColor: colors.primary,
                                            borderBottomWidth: 2,
                                        },
                                    ]}
                                    onPress={() => setSelectedFilter(filter.id)}
                                >
                                    <Icon
                                        size={20}
                                        color={
                                            selectedFilter === filter.id
                                                ? colors.primary
                                                : colors.textSecondary
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.filterText,
                                            {
                                                color:
                                                    selectedFilter === filter.id
                                                        ? colors.primary
                                                        : colors.textSecondary,
                                            },
                                        ]}
                                    >
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                <View style={styles.portfolio}>
                    {filteredPosts.map((post) => (
                        <TouchableOpacity
                            key={post._id}
                            style={styles.portfolioItem}
                            onPress={() => router.push(`/post/${post._id}`)}
                        >
                            <Image
                                source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                                style={styles.portfolioImage}
                                contentFit="cover"
                            />
                        </TouchableOpacity>
                    ))}
                    {filteredPosts.length === 0 && (
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            No {selectedFilter === 'all' ? 'posts' : selectedFilter} yet
                        </Text>
                    )}
                </View>
            </ScrollView>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        alignItems: 'center',
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 16,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
    },
    rolesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
        justifyContent: 'center',
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'capitalize',
    },
    bio: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 16,
    },
    info: {
        gap: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: 14,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 24,
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    stats: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    stat: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 40,
    },
    filters: {
        borderBottomWidth: 1,
        paddingHorizontal: 20,
    },
    filter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 8,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    portfolio: {
        padding: 2,
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    portfolioItem: {
        width: '33.33%',
        aspectRatio: 1,
        padding: 2,
    },
    portfolioImage: {
        width: '100%',
        height: '100%',
        borderRadius: 4,
    },
    emptyText: {
        textAlign: 'center',
        padding: 40,
        fontSize: 14,
        width: '100%',
    },
});
