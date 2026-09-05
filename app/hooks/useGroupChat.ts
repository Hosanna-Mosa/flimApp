import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { api } from '@/utils/api';
import { uploadMediaToCloudinary } from '@/utils/media';
import { CHAT_LIMITS, posterFrameFor } from '@/hooks/useChatAttachment';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useConfirm } from '@/hooks/useConfirm';
import { CommunityGroup, CommunityPost } from '@/types';

/** Quote snapshot carried on a reply. Mirrors the direct-message shape. */
export interface GroupReply {
  postId: string;
  senderName?: string;
  preview?: string;
  mediaType?: 'image' | 'video';
}

/**
 * All group-chat logic: loading community/groups/posts, the socket room
 * (join/leave + new/deleted posts), sending text and photos, polls,
 * membership and permissions, and the group options menu. The screen and
 * its components stay presentational.
 */
export function useGroupChat(communityId: string | undefined, groupId: string | undefined) {
  const router = useRouter();
  const { token, user } = useAuth();
  const { socket } = useSocket();
  const confirm = useConfirm();

  const [group, setGroup] = useState<CommunityGroup | null>(null);
  const [role, setRole] = useState<string>('member');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // ---- Identity + permissions
  const isMine = useCallback(
    (post: CommunityPost) => {
      const authorId = (post.author as any)?._id;
      return authorId === user?.id || authorId === (user as any)?._id;
    },
    [user]
  );
  const isAdminOrOwner = role === 'admin' || role === 'owner';
  const isMember = group?.isMember === true || isAdminOrOwner;
  const canSend = !!group && (!group.isAnnouncementOnly || isAdminOrOwner);
  // Join is offered whenever the group loaded and the viewer is not (implicitly) a member.
  const showJoin = !!group && !isMember;

  // ---- Load (three independent requests; posts often 403 for non-members)
  const loadData = useCallback(async () => {
    try {
      if (!communityId || !groupId) return;

      let comRes: any, groupsRes: any, postsRes: any;
      try {
        comRes = await api.community(communityId, token || undefined);
      } catch {}
      try {
        groupsRes = await api.communityGroups(communityId, token || undefined);
      } catch {}
      try {
        postsRes = await api.groupPosts(communityId, groupId, 0, 50, token || undefined);
      } catch {}

      setRole(comRes?.memberRole || 'member');

      let groupList: any[] = [];
      if (Array.isArray(groupsRes)) {
        groupList = groupsRes;
      } else if (groupsRes?.data && Array.isArray(groupsRes.data)) {
        groupList = groupsRes.data;
      }

      // Primary list first, then the community's embedded groups
      let currentGroup = groupList.find((g: any) => g._id === groupId);
      if (!currentGroup && comRes?.groups && Array.isArray(comRes.groups)) {
        currentGroup = comRes.groups.find((g: any) => g._id === groupId);
      }
      setGroup(currentGroup || null);

      // api.groupPosts returns { data: [], pagination: {} }
      const postsList = postsRes?.data || [];
      setPosts(Array.isArray(postsList) ? postsList : []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [communityId, groupId, token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---- Socket room
  useEffect(() => {
    if (!socket || !groupId || !communityId) return;
    // communityId is required server-side to verify membership before the
    // socket is admitted to the group room.
    socket.emit('join_group', { groupId, communityId });

    const handleNewPost = (post: any) => {
      setPosts((prev) => {
        if (prev.some((p) => p._id === post._id)) return prev;
        return [post, ...prev]; // newest first (inverted list)
      });
    };

    const handleDeletePost = ({ postId }: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    };

    socket.on('new_group_post', handleNewPost);
    socket.on('delete_group_post', handleDeletePost);

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('new_group_post', handleNewPost);
      socket.off('delete_group_post', handleDeletePost);
    };
  }, [socket, groupId, communityId]);

  /** Prepend a post unless it already arrived via socket. */
  const addPost = (post: CommunityPost) => {
    setPosts((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.some((p) => p._id === post._id)) return current;
      return [post, ...current];
    });
  };

  // ---- Send text
  const send = async (text: string, replyTo?: GroupReply) => {
    try {
      setSending(true);
      const result = (await api.createCommunityPost(
        communityId!,
        { groupId: groupId!, content: text, type: 'text', replyTo },
        token || ''
      )) as CommunityPost;
      addPost(result);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // ---- Photo or video (picker → Cloudinary → post)
  /**
   * Size is checked before the upload starts, matching direct chat. The old
   * version had no limit at all: a 500MB video would upload for minutes and
   * then be rejected by Cloudinary.
   */
  /**
   * Chosen but not yet sent, while the crop tool is open. Group posting used to
   * upload the moment a file was picked, which left nowhere for a crop step to
   * happen.
   */
  const [cropTarget, setCropTarget] = useState<{
    uri: string;
    width?: number;
    height?: number;
    name: string;
    size?: number;
    replyTo?: GroupReply;
  } | null>(null);

  const uploadAndPost = async (
    kind: 'image' | 'video',
    asset: { uri: string; name: string; size?: number; width?: number; height?: number; duration?: number },
    replyTo?: GroupReply
  ) => {
    try {
      setSending(true);
      const uploadResult = await uploadMediaToCloudinary(
        { uri: asset.uri, name: asset.name, size: asset.size },
        kind,
        token!
      );

      const postResult = (await api.createCommunityPost(
        communityId!,
        {
          groupId: groupId!,
          // No longer the literal word "Image", which used to render as the
          // caption under every picture in the group.
          content: '',
          type: kind,
          replyTo,
          media: [
            {
              url: uploadResult.url,
              type: kind,
              thumbnail: kind === 'video' ? posterFrameFor(uploadResult.url) : undefined,
              publicId: uploadResult.publicId,
              size: uploadResult.bytes || asset.size,
              width: uploadResult.width || asset.width,
              height: uploadResult.height || asset.height,
              duration: uploadResult.duration || asset.duration,
            },
          ],
        },
        token!
      )) as CommunityPost;
      addPost(postResult);
    } catch (error: any) {
      Alert.alert('Error', error?.message || `Failed to upload ${kind}`);
    } finally {
      setSending(false);
    }
  };

  /**
   * Size is checked before the upload starts, matching direct chat. The old
   * version had no limit at all: a 500MB video would upload for minutes and
   * then be rejected by Cloudinary.
   */
  const pickMedia = async (kind: 'image' | 'video', edit = false, replyTo?: GroupReply) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission needed',
          `Allow access to your ${kind === 'video' ? 'videos' : 'photos'} to attach one.`
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: kind === 'video' ? ['videos'] : ['images'],
        quality: kind === 'image' ? 0.8 : undefined,
        // Photos go through the app's own crop tool, which keeps the picture's
        // ratio and offers others. The system one is a square-locked rectangle
        // on iOS. Video still uses the system trimmer, which is fine.
        allowsEditing: kind === 'video' ? edit : false,
      });

      if (result.canceled || !result.assets?.[0] || !token) return;
      const asset = result.assets[0];
      const limit = CHAT_LIMITS[kind];

      if (asset.fileSize && asset.fileSize > limit) {
        Alert.alert(
          `${kind === 'video' ? 'Video' : 'Photo'} is too large`,
          `This one is ${Math.round(asset.fileSize / (1024 * 1024))} MB and the limit is ` +
            `${Math.round(limit / (1024 * 1024))} MB. Pick a ` +
            `${kind === 'video' ? 'shorter clip' : 'smaller photo'}, or compress it first.`
        );
        return;
      }

      const name = asset.fileName || (kind === 'video' ? 'video.mp4' : 'image.jpg');

      if (kind === 'image' && edit) {
        setCropTarget({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
          name,
          size: asset.fileSize ?? undefined,
          replyTo,
        });
        return;
      }

      await uploadAndPost(
        kind,
        {
          uri: asset.uri,
          name,
          size: asset.fileSize ?? undefined,
          width: asset.width,
          height: asset.height,
          duration: asset.duration ?? undefined,
        },
        replyTo
      );
    } catch (error: any) {
      Alert.alert('Error', error?.message || `Failed to pick ${kind}`);
    }
  };

  /** Called when the crop tool finishes, or is cancelled with the original. */
  const finishCrop = async (uri: string, width: number, height: number) => {
    const target = cropTarget;
    setCropTarget(null);
    if (!target) return;
    await uploadAndPost(
      'image',
      { uri, name: target.name, size: target.size, width, height },
      target.replyTo
    );
  };

  // The (+) button: photo or poll. Polls are composed on the community's
  // Create Post screen (the only place that builds a poll payload), opened
  // with this group preselected.
  const openAttachmentMenu = () => {
    Alert.alert('Add to group', undefined, [
      { text: 'Photo', onPress: () => pickMedia('image') },
      { text: 'Photo, cropped', onPress: () => pickMedia('image', true) },
      { text: 'Video', onPress: () => pickMedia('video') },
      { text: 'Video, trimmed', onPress: () => pickMedia('video', true) },
      {
        text: 'Create Poll',
        onPress: () =>
          router.push({
            pathname: '/communities/[id]/create-post',
            params: { id: communityId!, groupId: groupId! },
          }),
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ---- Poll vote (reload to pick up counts)
  const vote = async (postId: string, optionIndex: number) => {
    try {
      await api.votePoll(communityId!, postId, optionIndex, token || '');
      loadData();
    } catch {}
  };

  // ---- Join
  const join = async () => {
    if (isMember) return;
    try {
      setSending(true);
      await api.joinGroup(communityId!, groupId!, token || '');
      Alert.alert('Success', 'You have joined the group!');
      // Optimistic so the button disappears immediately
      setGroup((prev) => (prev ? { ...prev, isMember: true } : null));
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to join group');
    } finally {
      setSending(false);
    }
  };

  // ---- Delete a message (own, or any as admin/owner)
  const deleteMessage = async (post: CommunityPost) => {
    if (!(isMine(post) || isAdminOrOwner)) return;
    const confirmed = await confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await api.deleteCommunityPost(communityId!, post._id, token || '');
      setPosts((prev) => prev.filter((p) => p._id !== post._id));
    } catch {
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // ---- Options menu (Delete Group for admins/owners, Leave Group otherwise)
  const openMenu = () => {
    const options: any[] = [{ text: 'Cancel', style: 'cancel' }];

    if (isAdminOrOwner) {
      options.push({
        text: 'Delete Group',
        style: 'destructive',
        onPress: async () => {
          const confirmed = await confirm({ title: 'Delete Group', message: 'Are you sure?', confirmLabel: 'Delete', destructive: true });
          if (!confirmed) return;
          try {
            await api.deleteGroup(communityId!, groupId!, token || '');
            router.back();
          } catch {
            Alert.alert('Error', 'Failed to delete group');
          }
        },
      });
    } else {
      options.push({
        text: 'Leave Group',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.leaveGroup(communityId!, groupId!, token || '');
            router.back();
          } catch {}
        },
      });
    }
    Alert.alert('Group Options', undefined, options);
  };

  return {
    group,
    posts,
    loading,
    sending,
    role,
    isMine,
    isAdminOrOwner,
    isMember,
    canSend,
    showJoin,
    send,
    openAttachmentMenu,
    pickMedia,
    cropTarget,
    finishCrop,
    cancelCrop: () => setCropTarget(null),
    vote,
    join,
    deleteMessage,
    openMenu,
  };
}
