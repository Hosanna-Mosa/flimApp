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
    MessageCircle,
    Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import { ContentType } from '@/types';
import { ProfileSkeleton } from '@/components/skeletons/ProfileSkeleton';

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
    const [followStatus, setFollowStatus] = useState<'pending' | 'accepted' | null>(null);
    const [isPrivateAccount, setIsPrivateAccount] = useState(false);
    const [hasLimitedData, setHasLimitedData] = useState(false);
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
                api.user(id, token || undefined),
                api.getUserFeed(id, 0, 100, token || undefined).catch(() => ({ data: [] })),
            ]);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const userInfo = userData as any;
            setUser(userInfo);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setPosts((postsData as any).data || []);

            // Check if account is private
            const accountType = userInfo?.accountType || (userInfo?.isPrivate ? 'private' : 'public');
            setIsPrivateAccount(accountType === 'private');

            // Check follow status first to determine if we have limited data
            let isFollowingValue = false;
            let statusValue: 'pending' | 'accepted' | null = null;

            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const statusResponse: any = await api.getFollowStatus(id, token || undefined);
                // console.log('[UserProfile] Follow status response:', JSON.stringify(statusResponse));

                statusValue = statusResponse?.status ?? statusResponse?.data?.status ?? null;
                isFollowingValue = statusResponse?.isFollowing ?? statusResponse?.data?.isFollowing ?? false;

                // console.log('[UserProfile] Follow status:', statusValue, 'isFollowing:', isFollowingValue);
                setFollowStatus(statusValue);
                setIsFollowing(isFollowingValue);
            } catch (followError) {
                // console.error('[UserProfile] Error checking follow status:', followError);
                setIsFollowing(false);
                setFollowStatus(null);
            }

            // Check if we have limited data (private account AND not following)
            // Even if stats are returned, we should limit access if it's private and not following
            const limitedData = accountType === 'private' && !isFollowingValue && statusValue !== 'accepted';
            setHasLimitedData(limitedData);
            // console.log('[UserProfile] Limited data check:', {
            //     accountType,
            //     isFollowing: isFollowingValue,
            //     status: statusValue,
            //     hasLimitedData: limitedData
            // });
        } catch (error) {
            // console.error('[UserProfile] Error loading:', error);
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
            const wasPending = followStatus === 'pending';

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let result: any;

            if (wasFollowing || wasPending) {
                // Unfollow or cancel request
                result = await api.unfollowUser(id, token || undefined);
                // console.log('[UserProfile] Unfollow result:', JSON.stringify(result));
                setIsFollowing(false);
                setFollowStatus(null);

                // Update follower count only if it was accepted (not pending)
                if (wasFollowing && user) {
                    setUser({
                        ...user,
                        stats: {
                            followersCount: Math.max(0, (user.stats?.followersCount || 0) - 1),
                            followingCount: user.stats?.followingCount || 0,
                            postsCount: user.stats?.postsCount || 0,
                        },
                    });
                }
            } else {
                // Follow or send request
                result = await api.followUser(id, token || undefined);
                // console.log('[UserProfile] Follow result:', JSON.stringify(result));

                if (result.status === 'pending') {
                    // Private account - request sent
                    setFollowStatus('pending');
                    setIsFollowing(false);
                    Alert.alert('Follow Request Sent', 'This account is private. Your request is pending approval.');
                } else {
                    // Public account - immediately followed
                    setIsFollowing(true);
                    setFollowStatus('accepted');

                    // Optimistically update follower count
                    if (user) {
                        setUser({
                            ...user,
                            stats: {
                                followersCount: (user.stats?.followersCount || 0) + 1,
                                followingCount: user.stats?.followingCount || 0,
                                postsCount: user.stats?.postsCount || 0,
                            },
                        });
                    }
                }
            }

            // Update with actual data from backend if available
            if (result && result.followersCount !== undefined) {
                // console.log('[UserProfile] Updating follower count from backend:', result.followersCount);
                if (user) {
                    setUser({
                        ...user,
                        stats: {
                            followersCount: result.followersCount,
                            followingCount: user.stats?.followingCount || 0,
                            postsCount: user.stats?.postsCount || 0,
                        },
                    });
                }
            }
        } catch (error: any) {
            // console.error('[UserProfile] Follow error:', error);

            // Refresh follow status on error
            try {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const statusResponse: any = await api.getFollowStatus(id, token || undefined);
                const status = statusResponse?.status ?? statusResponse?.data?.status ?? null;
                const isFollowingValue = statusResponse?.isFollowing ?? statusResponse?.data?.isFollowing ?? false;
                setFollowStatus(status);
                setIsFollowing(isFollowingValue);
            } catch (refreshError) {
                // console.error('[UserProfile] Error refreshing follow status:', refreshError);
            }

            Alert.alert('Error', error?.message || 'Failed to update follow status');
        }
    };

    const handleMessage = () => {
        if (!user) return;

        router.push({
            pathname: '/chat',
            params: {
                userId: id,
                name: user.name || 'User'
            }
        });
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
                <ProfileSkeleton />
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
                            <BadgeCheck size={24} color="#FFFFFF" fill="#0095F6" />
                        )}
                    </View>

                    {!hasLimitedData && (
                        <>
                            {user.roles && user.roles.length > 0 && (
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
                            )}
                            {user.bio && (
                                <Text style={[styles.bio, { color: colors.textSecondary }]}>
                                    {user.bio}
                                </Text>
                            )}

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
                        </>
                    )}

                    {hasLimitedData && (
                        <View style={styles.privateMessageContainer}>
                            <Text style={[styles.privateMessage, { color: colors.textSecondary }]}>
                                This account is private. Follow to see their posts and updates.
                            </Text>
                        </View>
                    )}

                    <View style={styles.actionsContainer}>
                        <TouchableOpacity
                            style={[
                                styles.followButton,
                                {
                                    backgroundColor: (isFollowing || followStatus === 'pending') ? colors.surface : '#0095F6',
                                    borderColor: (isFollowing || followStatus === 'pending') ? colors.border : '#0095F6',
                                    // Make button full width if message button is hidden
                                    flex: (!isPrivateAccount || isFollowing) ? 1 : undefined,
                                    width: (!isPrivateAccount || isFollowing) ? undefined : '100%',
                                },
                            ]}
                            onPress={toggleFollow}
                        >
                            {isFollowing ? (
                                <Check size={20} color={colors.text} />
                            ) : followStatus === 'pending' ? (
                                <Clock size={20} color={colors.text} />
                            ) : (
                                <Plus size={20} color="#fff" />
                            )}
                            <Text style={[styles.followButtonText, { color: (isFollowing || followStatus === 'pending') ? colors.text : '#fff' }]}>
                                {isFollowing ? 'Following' : followStatus === 'pending' ? 'Requested' : (isPrivateAccount ? 'Request' : 'Follow')}
                            </Text>
                        </TouchableOpacity>

                        {/* Only show message button if not private account OR if following private account */}
                        {(!isPrivateAccount || isFollowing) && (
                            <TouchableOpacity
                                style={[
                                    styles.messageButton,
                                    {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={handleMessage}
                            >
                                <MessageCircle size={20} color={colors.text} />
                                <Text style={[styles.messageButtonText, { color: colors.text }]}>
                                    Message
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.stats}>
                        <View style={styles.stat}>
                            <Text style={[styles.statValue, { color: colors.text }]}>
                                {user.stats?.postsCount ?? 0}
                            </Text>
                            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                Posts
                            </Text>
                        </View>
                        <View
                            style={[styles.statDivider, { backgroundColor: colors.border }]}
                        />
                        {hasLimitedData ? (
                            // Private account, not following - show non-clickable stats
                            <View style={styles.stat} pointerEvents="none">
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {user.stats?.followersCount ?? 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Followers
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.stat}
                                onPress={() => {
                                    router.push({
                                        pathname: '/user/network',
                                        params: {
                                            userId: id,
                                            type: 'followers'
                                        }
                                    });
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {user.stats?.followersCount ?? 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Followers
                                </Text>
                            </TouchableOpacity>
                        )}
                        <View
                            style={[styles.statDivider, { backgroundColor: colors.border }]}
                        />
                        {hasLimitedData ? (
                            // Private account, not following - show non-clickable stats
                            <View style={styles.stat} pointerEvents="none">
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {user.stats?.followingCount ?? 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Following
                                </Text>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.stat}
                                onPress={() => {
                                    router.push({
                                        pathname: '/user/network',
                                        params: {
                                            userId: id,
                                            type: 'following'
                                        }
                                    });
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.statValue, { color: colors.text }]}>
                                    {user.stats?.followingCount ?? 0}
                                </Text>
                                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                                    Following
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {!hasLimitedData && (
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
                )}

                {!hasLimitedData && (
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
                )}

                {hasLimitedData && (
                    <View style={styles.privatePostsContainer}>
                        <Text style={[styles.privatePostsText, { color: colors.textSecondary }]}>
                            Posts are hidden for private accounts
                        </Text>
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
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 24,
    },
    followButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
    },
    followButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    messageButtonText: {
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
    privateMessageContainer: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 20,
    },
    privateMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    privatePostsContainer: {
        padding: 40,
        alignItems: 'center',
    },
    privatePostsText: {
        fontSize: 14,
        textAlign: 'center',
    },
});
