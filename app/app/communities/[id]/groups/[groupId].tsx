import React, { useEffect, useRef, useState } from 'react';
import { Platform, ToastAndroid, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MoreVertical } from 'lucide-react-native';
import { useGroupChat } from '@/hooks/useGroupChat';
import ChatScreenShell from '@/components/chat/ChatScreenShell';
import ChatHeader from '@/components/chat/ChatHeader';
import GroupMessageList from '@/components/chat/GroupMessageList';
import GroupIntroCard from '@/components/chat/GroupIntroCard';
import GroupJoinPrompt from '@/components/chat/GroupJoinPrompt';
import GroupReadOnlyFooter from '@/components/chat/GroupReadOnlyFooter';
import ChatInputBar from '@/components/chat/ChatInputBar';
import AttachmentPreview from '@/components/chat/AttachmentPreview';
import LoadingScreen from '@/components/ui/LoadingScreen';
import MessageActionSheet, { MessageActionTarget } from '@/components/chat/MessageActionSheet';
import MediaViewer from '@/components/chat/MediaViewer';
import ImageCropper from '@/components/chat/ImageCropper';
import ForwardSheet, { ForwardPayload } from '@/components/chat/ForwardSheet';
import { GroupReply } from '@/hooks/useGroupChat';
import { withinChatLimits } from '@/hooks/useChatAttachment';
import { DirectMessageMedia } from '@/components/chat/ChatMessageBubble';
import { SharedFile, readStagedShare } from '@/utils/shareIntent';

export default function GroupChatScreen() {
  const { id, groupId, shareToken } = useLocalSearchParams<{
    id: string;
    groupId: string;
    shareToken?: string;
  }>();
  const g = useGroupChat(id, groupId);

  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [viewing, setViewing] = useState<DirectMessageMedia | null>(null);
  const [forwarding, setForwarding] = useState<ForwardPayload | null>(null);
  const [replyTo, setReplyTo] = useState<GroupReply | null>(null);
  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);
  const [sharedText, setSharedText] = useState<string | undefined>();
  const [uploadIndex, setUploadIndex] = useState(0);

  const toast = (text: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(text, ToastAndroid.SHORT);
    else Alert.alert(text);
  };

  /**
   * Content arriving from the OS share sheet, chosen for this group on the
   * "Share to" screen. Staged into the composer and sent only on Send, the
   * same as a photo picked from the (+) menu.
   */
  const stagedToken = useRef<string | null>(null);
  useEffect(() => {
    if (!shareToken || stagedToken.current === shareToken) return;
    const share = readStagedShare(shareToken);
    if (!share) return;

    stagedToken.current = shareToken;
    if (share.files.length > 0) setSharedFiles(withinChatLimits(share.files));
    if (share.text) setSharedText(share.text);
  }, [shareToken]);

  const handleSend = async (text: string) => {
    if (sharedFiles.length === 0) {
      const result = await g.send(text, replyTo ?? undefined);
      setReplyTo(null);
      return result;
    }

    // One post per file, with the caption and the quote on the first only —
    // repeating them under every photo would read as the same message over
    // and over.
    for (let i = 0; i < sharedFiles.length; i++) {
      const file = sharedFiles[i];
      setUploadIndex(i);
      const posted = await g.uploadAndPost(
        file.kind,
        {
          uri: file.uri,
          name: file.name,
          size: file.size,
          width: file.width,
          height: file.height,
          duration: file.duration,
        },
        i === 0 ? replyTo ?? undefined : undefined,
        i === 0 ? text : ''
      );
      if (!posted) {
        setUploadIndex(0);
        return false;
      }
    }

    setSharedFiles([]);
    setUploadIndex(0);
    setReplyTo(null);
    return true;
  };

  if (g.loading) {
    return (
      <ChatScreenShell header={<ChatHeader title="Loading..." />}>
        <LoadingScreen />
      </ChatScreenShell>
    );
  }

  return (
    // iOS pads for the keyboard here; on Android ChatInputBar lifts itself.
    <ChatScreenShell
      keyboardAvoiding
      header={
        <ChatHeader
          title={g.group?.name || 'Group'}
          rightAction={{ icon: MoreVertical, onPress: g.openMenu, accessibilityLabel: 'Group options' }}
        />
      }
    >
      <GroupMessageList
        posts={g.posts}
        isMine={g.isMine}
        onVote={g.vote}
        onLongPress={(post) =>
          setActionTarget({
            id: post._id,
            text: post.content || '',
            isMine: g.isMine(post),
          })
        }
        onPressMedia={(media) =>
          setViewing({
            url: media.url,
            type: media.type === 'video' ? 'video' : 'image',
            thumbnail: media.thumbnail,
            width: media.width,
            height: media.height,
          })
        }
        intro={
          <GroupIntroCard
            name={g.group?.name}
            description={g.group?.description}
            isAnnouncementOnly={g.group?.isAnnouncementOnly}
          />
        }
      />
      {sharedFiles.length > 0 && g.canSend && !g.showJoin && (
        <AttachmentPreview
          attachment={sharedFiles[uploadIndex] ?? sharedFiles[0]}
          uploading={g.sending}
          progress={g.uploadProgress}
          remaining={sharedFiles.length - 1}
          uploadIndex={uploadIndex}
          onRemove={() => setSharedFiles([])}
        />
      )}
      {g.showJoin ? (
        <GroupJoinPrompt onJoin={g.join} loading={g.sending} />
      ) : g.canSend ? (
        <ChatInputBar
          onSend={handleSend}
          placeholder="Message..."
          loading={g.sending}
          hasAttachment={sharedFiles.length > 0}
          onAttachment={g.openAttachmentMenu}
          replyingTo={replyTo?.senderName}
          onCancelReply={() => setReplyTo(null)}
          initialText={sharedText}
        />
      ) : (
        <GroupReadOnlyFooter groupFound={!!g.group} />
      )}
      <MessageActionSheet
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={(postId) => {
          const post = g.posts.find((p) => p._id === postId);
          if (post) g.deleteMessage(post);
        }}
        onCopied={() => toast('Copied')}
        onReply={(t) => {
          const post = g.posts.find((p) => p._id === t.id);
          setReplyTo({
            postId: t.id,
            senderName: t.isMine ? 'You' : post?.author?.name || 'Someone',
            preview: t.text || undefined,
            mediaType: post?.media?.[0]?.type === 'video' ? 'video' : post?.media?.[0] ? 'image' : undefined,
          });
        }}
        onForward={(t) => {
          const post = g.posts.find((p) => p._id === t.id);
          const m = post?.media?.[0];
          setForwarding({
            content: t.text,
            media: m
              ? {
                  url: m.url,
                  type: m.type === 'video' ? 'video' : 'image',
                  thumbnail: m.thumbnail,
                  width: m.width,
                  height: m.height,
                }
              : undefined,
          });
        }}
      />

      {/* Same crop tool as direct chat, so the two do not diverge again. */}
      <ImageCropper
        uri={g.cropTarget?.uri ?? null}
        width={g.cropTarget?.width}
        height={g.cropTarget?.height}
        onCancel={() => {
          // Cancelling keeps the picture as taken rather than discarding the
          // pick, matching direct chat.
          const t = g.cropTarget;
          if (t) g.finishCrop(t.uri, t.width ?? 0, t.height ?? 0);
        }}
        onDone={({ uri, width, height }) => g.finishCrop(uri, width, height)}
      />

      <MediaViewer
        media={viewing}
        onClose={() => setViewing(null)}
        onForward={(media) => setForwarding({ media })}
      />

      {/* Forwarding leaves the community: a group message goes into a direct
          chat, which is where "send this to someone" actually means something. */}
      <ForwardSheet
        payload={forwarding}
        onClose={() => setForwarding(null)}
        onSent={(name) => toast(`Sent to ${name}`)}
      />
    </ChatScreenShell>
  );
}
