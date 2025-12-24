# Frontend API Integration Guide

## 🎯 How to Use Social Media APIs in React Native

All API functions are now available in `utils/api.ts`. Import and use them in your components.

---

## 📱 **Quick Examples**

### **1. Like/Unlike a Post**

```typescript
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { Heart } from 'lucide-react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function LikeButton({ postId, initialLiked, initialCount }) {
  const { auth } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleLike = async () => {
    if (loading) return;
    
    setLoading(true);
    
    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      if (liked) {
        const result = await api.unlikePost(postId, auth?.token);
        setCount(result.likesCount);
      } else {
        const result = await api.likePost(postId, auth?.token);
        setCount(result.likesCount);
      }
    } catch (error) {
      // Revert on error
      setLiked(liked);
      setCount(count);
      console.error('Like error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity onPress={handleLike}>
      <Heart 
        size={24} 
        color={liked ? '#EF4444' : '#999'} 
        fill={liked ? '#EF4444' : 'transparent'}
      />
      <Text>{count}</Text>
    </TouchableOpacity>
  );
}
```

---

### **2. Follow/Unfollow a User**

```typescript
import { useState } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function FollowButton({ userId }) {
  const { auth } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    if (loading) return;
    
    setLoading(true);

    try {
      if (following) {
        await api.unfollowUser(userId, auth?.token);
        setFollowing(false);
      } else {
        const result = await api.followUser(userId, auth?.token);
        setFollowing(result.status === 'accepted');
        
        if (result.status === 'pending') {
          alert('Follow request sent');
        }
      }
    } catch (error) {
      console.error('Follow error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleFollow}
      disabled={loading}
      style={{
        paddingHorizontal: 20,
        paddingVertical: 8,
        backgroundColor: following ? '#333' : '#D4AF37',
        borderRadius: 20,
      }}
    >
      <Text style={{ color: 'white' }}>
        {loading ? 'Loading...' : following ? 'Following' : 'Follow'}
      </Text>
    </TouchableOpacity>
  );
}
```

---

### **3. Add Comment**

```typescript
import { useState } from 'react';
import { TextInput, TouchableOpacity, Text } from 'react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function CommentInput({ postId, onCommentAdded }) {
  const { auth } = useAuth();
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!comment.trim() || loading) return;

    setLoading(true);

    try {
      const result = await api.addComment(
        postId,
        comment.trim(),
        undefined, // parentCommentId for replies
        auth?.token
      );

      setComment('');
      onCommentAdded?.(result.data);
      alert('Comment posted!');
    } catch (error) {
      console.error('Comment error:', error);
      alert('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TextInput
        value={comment}
        onChangeText={setComment}
        placeholder="Add a comment..."
        multiline
        style={{
          borderWidth: 1,
          borderColor: '#333',
          borderRadius: 8,
          padding: 12,
          minHeight: 50,
        }}
      />
      <TouchableOpacity 
        onPress={handleSubmit}
        disabled={loading || !comment.trim()}
      >
        <Text>Post</Text>
      </TouchableOpacity>
    </>
  );
}
```

---

### **4. Load Personalized Feed**

```typescript
import { useState, useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function FeedScreen() {
  const { auth } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);

  const loadFeed = async (pageNum = 0, refresh = false) => {
    if (loading && !refresh) return;

    refresh ? setRefreshing(true) : setLoading(true);

    try {
      const result = await api.getFeed(
        pageNum,
        20,
        'hybrid', // algorithm: 'hybrid', 'chronological', 'engagement'
        7, // timeRange in days
        auth?.token
      );

      if (refresh) {
        setPosts(result.data);
      } else {
        setPosts([...posts, ...result.data]);
      }
      
      setPage(pageNum);
    } catch (error) {
      console.error('Feed error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed(0);
  }, []);

  const handleRefresh = () => {
    loadFeed(0, true);
  };

  const handleLoadMore = () => {
    if (!loading) {
      loadFeed(page + 1);
    }
  };

  return (
    <FlatList
      data={posts}
      renderItem={({ item }) => <PostCard post={item} />}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={handleRefresh} 
        />
      }
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
```

---

### **5. Share a Post**

```typescript
import { Alert } from 'react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function ShareButton({ postId }) {
  const { auth } = useAuth();

  const handleShare = async (type: 'repost' | 'quote' | 'external') => {
    try {
      await api.sharePost(
        postId,
        {
          shareType: type,
          caption: type === 'quote' ? 'Check this out!' : undefined,
          platform: type === 'external' ? 'whatsapp' : undefined,
        },
        auth?.token
      );

      Alert.alert('Success', 'Post shared!');
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share post');
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        Alert.alert(
          'Share Post',
          'Choose how to share',
          [
            { text: 'Repost', onPress: () => handleShare('repost') },
            { text: 'Quote Share', onPress: () => handleShare('quote') },
            { text: 'Share External', onPress: () => handleShare('external') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
      }}
    >
      <Share2 size={24} color="#999" />
    </TouchableOpacity>
  );
}
```

---

### **6. Get User's Followers/Following**

```typescript
import { useState, useEffect } from 'react';
import { FlatList } from 'react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function FollowersScreen({ userId }) {
  const { auth } = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFollowers();
  }, [userId]);

  const loadFollowers = async () => {
    setLoading(true);
    try {
      const result = await api.getFollowers(userId, 0, 20, auth?.token);
      setFollowers(result.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FlatList
      data={followers}
      renderItem={({ item }) => <UserListItem user={item} />}
      keyExtractor={(item) => item._id}
      refreshing={loading}
      onRefresh={loadFollowers}
    />
  );
}
```

---

### **7. Check Follow/Like Status**

```typescript
import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function usePostStatus(postId: string) {
  const { auth } = useAuth();
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [postId]);

  const checkStatus = async () => {
    try {
      const result = await api.hasLiked(postId, auth?.token);
      setLiked(result.liked);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { liked, loading, refresh: checkStatus };
}

function useFollowStatus(userId: string) {
  const { auth } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    try {
      const result = await api.isFollowing(userId, auth?.token);
      setFollowing(result.following);
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setLoading(false);
    }
  };

  return { following, loading, refresh: checkStatus };
}
```

---

## 🎨 **Complete Post Card Example**

```typescript
import { useState } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import api from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

function PostCard({ post }) {
  const { auth } = useAuth();
  const [liked, setLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.engagement.likesCount);
  const [commentsCount, setCommentsCount] = useState(post.engagement.commentsCount);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(newLiked ? likesCount + 1 : likesCount - 1);

    try {
      const result = newLiked 
        ? await api.likePost(post._id, auth?.token)
        : await api.unlikePost(post._id, auth?.token);
      
      setLikesCount(result.likesCount);
    } catch (error) {
      // Revert on error
      setLiked(!newLiked);
      setLikesCount(newLiked ? likesCount - 1 : likesCount + 1);
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: '#1A1A1A', marginBottom: 16 }}>
      {/* User Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <Image 
          source={{ uri: post.author.avatar }} 
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {post.author.name}
          </Text>
          <Text style={{ color: '#999', fontSize: 12 }}>
            {post.author.roles.join(' • ')}
          </Text>
        </View>
      </View>

      {/* Post Media */}
      {post.mediaUrl && (
        <Image 
          source={{ uri: post.mediaUrl }} 
          style={{ width: '100%', height: 300, borderRadius: 12 }}
        />
      )}

      {/* Caption */}
      <Text style={{ color: 'white', marginTop: 12 }}>
        {post.caption}
      </Text>

      {/* Actions */}
      <View style={{ flexDirection: 'row', marginTop: 16, gap: 24 }}>
        <TouchableOpacity 
          onPress={handleLike}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Heart 
            size={24} 
            color={liked ? '#EF4444' : '#999'} 
            fill={liked ? '#EF4444' : 'transparent'}
          />
          <Text style={{ color: '#999' }}>{likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <MessageCircle size={24} color="#999" />
          <Text style={{ color: '#999' }}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Share2 size={24} color="#999" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 📝 **All Available API Functions**

### **Likes**
- `api.likePost(postId, token)`
- `api.unlikePost(postId, token)`
- `api.getPostLikes(postId, page, limit, token)`
- `api.getUserLikedPosts(userId, page, limit, token)`
- `api.hasLiked(postId, token)`

### **Follows**
- `api.followUser(userId, token)`
- `api.unfollowUser(userId, token)`
- `api.getFollowers(userId, page, limit, token)`
- `api.getFollowing(userId, page, limit, token)`
- `api.getPendingRequests(page, limit, token)`
- `api.acceptFollowRequest(userId, token)`
- `api.rejectFollowRequest(userId, token)`
- `api.isFollowing(userId, token)`
- `api.getMutualFollowers(userId, token)`

### **Comments**
- `api.addComment(postId, content, parentCommentId?, token)`
- `api.getComments(postId, page, limit, sortBy, token)`
- `api.getCommentReplies(commentId, page, limit, token)`
- `api.editComment(commentId, content, token)`
- `api.deleteComment(commentId, token)`
- `api.likeComment(commentId, token)`
- `api.getUserComments(userId, page, limit, token)`

### **Shares**
- `api.sharePost(postId, payload, token)`
- `api.getPostShares(postId, page, limit, token)`
- `api.getUserShares(userId, page, limit, token)`
- `api.deleteShare(shareId, token)`
- `api.getShareStats(postId, token)`

### **Feeds**
- `api.getFeed(page, limit, algorithm, timeRange, token)`
- `api.getTrendingFeed(page, limit, token)`
- `api.getIndustryFeed(industry, page, limit, token)`
- `api.getUserFeed(userId, page, limit, token)`
- `api.invalidateFeed(token)`

---

## 🚀 **Usage Tips**

1. **Always use optimistic updates** for better UX (update UI first, sync with server)
2. **Handle errors gracefully** with try/catch and revert on failure
3. **Use loading states** to prevent double-clicks
4. **Cache data** where possible using React Query or similar
5. **Show feedback** to users (toast, alerts, etc.)

---

**Ready to build! All APIs are connected and documented.** 🎉
