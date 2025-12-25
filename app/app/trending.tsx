import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetTrendingFeed } from '@/utils/api';
import { Image } from 'expo-image';
import { Play, Music, FileText, Film, Flame } from 'lucide-react-native';

export default function TrendingScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingPosts = async () => {
    try {
      const response = await apiGetTrendingFeed(0, 20, token || undefined) as any;
      if (response && response.data) {
        // Map backend posts to local structure if needed, or use as is
        // Currently the UI expects: id, thumbnail/mediaUrl, caption, type, likes
        const mappedPosts = response.data.map((post: any) => ({
          id: post._id,
          thumbnailUrl: post.thumbnailUrl,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          type: post.type,
          likes: post.engagement?.likesCount || 0,
        }));
        setTrendingPosts(mappedPosts);
      }
    } catch (error) {
      console.error('Error fetching trending posts:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingPosts();
  }, [token]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrendingPosts();
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
      default:
        return <Film {...iconProps} />;
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Trending',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
             <Flame size={32} color={colors.primary} />
             <Text style={[styles.headerTitle, { color: colors.text }]}>Trending Now</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          trendingPosts.map((post, index) => (
            <TouchableOpacity
              key={post.id}
              style={[
                styles.trendingItem,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              
              <Image
                source={{ uri: post.thumbnailUrl || post.mediaUrl }}
                style={styles.thumbnail}
                contentFit="cover"
              />
              
              <View style={styles.info}>
                  <Text style={[styles.caption, { color: colors.text }]} numberOfLines={2}>
                      {post.caption}
                  </Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
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
  trendingItem: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    height: 100
  },
  rankBadge: {
      position: 'absolute',
      left: 0,
      top: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: 6,
      zIndex: 10,
      borderBottomRightRadius: 8
  },
  rankText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 12
  },
  thumbnail: {
      width: 100,
      height: '100%'
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
  meta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8
  },
  likes: {
      fontSize: 14
  }
});

