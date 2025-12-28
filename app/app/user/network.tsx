import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/utils/api';
import UserListItem from '@/components/UserListItem';
import { User } from '@/types';

export default function UserNetworkScreen() {
    const { colors } = useTheme();
    const router = useRouter();
    const { userId, type } = useLocalSearchParams<{ userId: string; type: 'followers' | 'following' }>();
    const { token } = useAuth();

    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const title = type === 'following' ? 'Following' : 'Followers';

    const loadData = useCallback(async (pageNum = 0, shouldRefresh = false, query = searchQuery) => {
        if (!userId) return;

        try {
            if (pageNum === 0) setLoading(true);

            const response = await (type === 'following'
                ? api.getFollowing(userId, pageNum, 20, token || undefined, query)
                : api.getFollowers(userId, pageNum, 20, token || undefined, query));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data = (response as any).data || [];
            const pagination = (response as any).pagination;

            if (shouldRefresh || pageNum === 0) {
                setUsers(data);
            } else {
                setUsers(prev => [...prev, ...data]);
            }

            setHasMore(data.length === 20);
            setPage(pageNum);
        } catch (error) {
            // console.error('Error loading network:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userId, type, token]); // Removed searchQuery from dependency to avoid loop, passed as arg

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadData(0, true, searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, loadData]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadData(0, true, searchQuery);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadData(page + 1, false, searchQuery);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    headerTitle: title,
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 10 }}>
                            <ArrowLeft size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                    headerStyle: { backgroundColor: colors.background },
                    headerTintColor: colors.text,
                    headerShadowVisible: false,
                }}
            />

            <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface }]}>
                    <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder={`Search ${title.toLowerCase()}...`}
                        placeholderTextColor={colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {loading && page === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item._id || item.id}
                    renderItem={({ item }) => (
                        <UserListItem user={item} />
                    )}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                {searchQuery
                                    ? `No matching ${type} found`
                                    : type === 'following' ? 'Not following anyone yet' : 'No followers yet'
                                }
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        loading && page > 0 ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 20 }} />
                        ) : null
                    }
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderBottomWidth: 1,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderRadius: 12,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        textAlign: 'center',
    },
});
