import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { api } from '@/utils/api';
import { CommunityGroup, CommunityPost } from '@/types';
import { MessageBubble, ChatInput } from '@/components/communities/ChatComponents';
import { MoreVertical } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { uploadMediaToCloudinary } from '@/utils/media';

export default function GroupChatScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string, groupId: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { token, user } = useAuth();
  const { socket } = useSocket();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [role, setRole] = useState<string>('member');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Load Data
  const loadData = useCallback(async () => {
    try {
      if (!id || !groupId) return;

      let comRes, groupsRes, postsRes;

      // console.log('🚀 [LoadData] Starting...', { id, groupId });

      // 1. Load Community (Independent)
      try {
        // console.log('📡 [LoadData] Fetching community...');
        comRes = await api.community(id, token || undefined) as any;
        // console.log('✅ [LoadData] Community loaded');
      } catch (e) {
        // console.error('❌ [LoadData] Community failed:', e);
      }

      // 2. Load Groups (Independent)
      try {
        // console.log('📡 [LoadData] Fetching groups...');
        groupsRes = await api.communityGroups(id, token || undefined) as any;
        // console.log('✅ [LoadData] Groups loaded');
      } catch (e) {
        // console.error('❌ [LoadData] Groups failed:', e);
      }

      // 3. Load Posts (Independent - often fails if not a member)
      try {
        // console.log('📡 [LoadData] Fetching posts...');
        postsRes = await api.groupPosts(id, groupId, 0, 50, token || undefined) as any;
        // console.log('✅ [LoadData] Posts loaded');
      } catch (e) {
        // console.warn('⚠️ [LoadData] Posts failed (user likely not a member):', e);
      }

      setRole(comRes?.memberRole || 'member');

      // Robustly get groups list from groupsRes or comRes
      let groupList: any[] = [];
      if (Array.isArray(groupsRes)) {
        groupList = groupsRes;
      } else if (groupsRes?.data && Array.isArray(groupsRes.data)) {
        groupList = groupsRes.data;
      }

      // Try to find group in primary list, then fallback to community embedded list
      let currentGroup = groupList.find((g: any) => g._id === groupId);
      if (!currentGroup && comRes?.groups && Array.isArray(comRes.groups)) {
        currentGroup = comRes.groups.find((g: any) => g._id === groupId);
      }

      setGroup(currentGroup || null);

      // api.groupPosts returns { data: [], pagination: {} }
      const postsList = postsRes?.data || [];
      setPosts(Array.isArray(postsList) ? postsList : []);
    } catch (error) {
      // console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id, groupId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Socket
  useEffect(() => {
    if (!socket || !groupId) return;
    socket.emit('join_group', groupId);

    const handleNewPost = (post: any) => {
      setPosts(prev => {
        if (prev.some(p => p._id === post._id)) return prev;
        return [post, ...prev]; // Add to bottom (index 0 in inverted)
      });
    };

    const handleDeletePost = ({ postId }: { postId: string }) => {
      setPosts(prev => prev.filter(p => p._id !== postId));
    };

    socket.on('new_group_post', handleNewPost);
    socket.on('delete_group_post', handleDeletePost);

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('new_group_post', handleNewPost);
      socket.off('delete_group_post', handleDeletePost);
    };
  }, [socket, groupId]);

  const handleSendMessage = async (text: string) => {
    try {
      setSending(true);

      const result = await api.createCommunityPost(id!, {
        groupId: groupId!,
        content: text,
        type: 'text'
      }, token || undefined) as CommunityPost;

      // Optimistic update - add message immediately to UI
      setPosts(prev => {
        // Check if message already exists (from socket or previous add)
        // Ensure prev is an array
        const currentPosts = Array.isArray(prev) ? prev : [];
        if (currentPosts.some(p => p._id === result._id)) return currentPosts;
        return [result, ...currentPosts];
      });

    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow access to your media library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0] && token) {
        setSending(true);
        const asset = result.assets[0];
        
        // Upload
        const uploadResult = await uploadMediaToCloudinary(
          {
            uri: asset.uri,
            name: asset.fileName || 'image.jpg',
            type: asset.mimeType,
            size: asset.fileSize,
          },
          'image',
          token
        );

        // Create Post
        const postResult = await api.createCommunityPost(id!, {
          groupId: groupId!,
          content: 'Image',
          type: 'image',
          media: [{
            url: uploadResult.url,
            type: 'image',
            title: asset.fileName || 'Image',
            size: uploadResult.bytes || asset.fileSize
          }]
        }, token) as CommunityPost;

        // Optimistic Update
        setPosts(prev => {
          const current = Array.isArray(prev) ? prev : [];
          if (current.some(p => p._id === postResult._id)) return current;
          return [postResult, ...current];
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to upload image');
    } finally {
      setSending(false);
    }
  };

  const handleVote = async (postId: string, idx: number) => {
    try {
      await api.votePoll(id!, postId, idx, token || undefined);
      // Reload or update locally? Ideally socket handles poll update too.
      loadData();
    } catch (e) { // console.error(e); 
    }
  };

  const handleMenu = () => {
    const options = [
      { text: 'Cancel', style: 'cancel' as const }
    ];

    if (role === 'admin' || role === 'owner') {
      options.push({
        text: 'Delete Group',
        style: 'destructive' as const,
        onPress: () => {
          Alert.alert('Delete Group', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  await api.deleteGroup(id!, groupId!, token || undefined);
                  router.back();
                } catch (e) { Alert.alert('Error', 'Failed to delete group'); }
              }
            }
          ]);
        }
      } as any);
    } else {
      options.push({
        text: 'Leave Group',
        style: 'destructive' as const,
        onPress: async () => {
          try {
            await api.leaveGroup(id!, groupId!, token || undefined);
            router.back();
          } catch (e) { // console.error(e); 
          }
        }
      } as any);
    }
    Alert.alert('Group Options', undefined, options);
  };

  // Check write permissions
  const canSend = group && (!group.isAnnouncementOnly || role === 'admin' || role === 'owner');

  useEffect(() => {
    if (group) {
      // console.log('🔍 Group Permission Debug:', {
      //   groupName: group.name,
      //   groupType: group.type,
      //   isAnnouncementOnly: group.isAnnouncementOnly, // This is the key field
      //   myRole: role,
      //   canISend: canSend,
      //   rawGroup: JSON.stringify(group) // Inspect the full object
      // });
    }
  }, [group, role, canSend]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Check if user is effectively a member (implicit or explicit)
  const isAdminOrOwner = role === 'admin' || role === 'owner';
  const isMember = group?.isMember === true || isAdminOrOwner;

  const handleJoinGroup = async () => {
    if (isMember) return; // Prevent re-joining

    try {
      setSending(true);
      await api.joinGroup(id!, groupId!, token || undefined);
      Alert.alert('Success', 'You have joined the group!');
      
      // Optimistically update local state so button disappears immediately
      setGroup(prev => prev ? ({ ...prev, isMember: true }) : null);
      
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to join group');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (post: CommunityPost) => {
    // Check permissions
    const isMe = (post.author as any)._id === (user as any)?._id || (post.author as any)._id === user?.id;
    const canDelete = isMe || role === 'admin' || role === 'owner';

    if (!canDelete) return;

    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.deleteCommunityPost(id!, post._id, token || undefined);
            setPosts(prev => prev.filter(p => p._id !== post._id));
          } catch (error: any) {
            Alert.alert('Error', 'Failed to delete message');
          }
        }
      }
    ]);
  };

  // Only show Join button if:
  // 1. Group data is loaded
  // 2. User is NOT a member (and not an Admin/Owner)
  // 3. User is NOT unauthorized (handled by server, but UI check helps)
  // 4. It's not an announcement-only group (usually separate logic, but here regular users join announcement groups to read?)
  // Note: Announcement groups might be "Follow" conceptually, but API is "Join".
  // Assuming users validly "Join" any group to see content.
  const showJoin = group && !isMember;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom', 'left', 'right']}>
      <Stack.Screen
        options={{
          title: group?.name || 'Group',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerRight: () => (
            <TouchableOpacity onPress={handleMenu}>
              <MoreVertical color={colors.text} size={24} />
            </TouchableOpacity>
          )
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMe={
                (item.author as any)?._id === user?.id ||
                (item.author as any)?._id === (user as any)?._id
              }
              onVote={(idx: number) => handleVote(item._id, idx)}
              onLongPress={() => handleDeleteMessage(item)}
            />
          )}
          inverted
          contentContainerStyle={{ paddingVertical: 16 }}
          ListFooterComponent={ // Appears at TOP because inverted
            <View style={styles.introContainer}>
              <Text style={[styles.introTitle, { color: colors.text }]}>Welcome to {group?.name}</Text>
              <Text style={[styles.introDesc, { color: colors.textSecondary }]}>{group?.description}</Text>
              <Text style={[styles.introNote, { color: colors.textSecondary }]}>
                {group?.isAnnouncementOnly ? 'This is an announcement channel.' : 'Start the conversation!'}
              </Text>
            </View>
          }
        />

        {showJoin ? (
          <View style={[styles.footerMessage, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.text, marginBottom: 8, textAlign: 'center' }}>
              You are not a member of this group.
            </Text>
            <TouchableOpacity
              style={[styles.joinButton, { backgroundColor: colors.primary }]}
              onPress={handleJoinGroup}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Join Group</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : canSend ? (
          <ChatInput
            onSend={handleSendMessage}
            loading={sending}
            onAttachment={handleAttachment}
          />
        ) : (
          <View style={[styles.footerMessage, { backgroundColor: colors.card }]}>
            <Text style={{ color: colors.textSecondary }}>
              {!group ? 'Group not found' : 'Only admins can send messages.'}
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introContainer: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 16,
    opacity: 0.8
  },
  introTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  introDesc: {
    textAlign: 'center',
    marginBottom: 8
  },
  introNote: {
    fontSize: 12,
    fontStyle: 'italic'
  },
  footerMessage: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  joinButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8
  }
});


