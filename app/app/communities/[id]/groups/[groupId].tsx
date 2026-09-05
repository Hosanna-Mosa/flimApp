import React, { useState } from 'react';
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
import LoadingScreen from '@/components/ui/LoadingScreen';
import MessageActionSheet, { MessageActionTarget } from '@/components/chat/MessageActionSheet';
import MediaViewer from '@/components/chat/MediaViewer';
import ImageCropper from '@/components/chat/ImageCropper';
import ForwardSheet, { ForwardPayload } from '@/components/chat/ForwardSheet';
import { GroupReply } from '@/hooks/useGroupChat';
import { DirectMessageMedia } from '@/components/chat/ChatMessageBubble';

export default function GroupChatScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const g = useGroupChat(id, groupId);

  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [viewing, setViewing] = useState<DirectMessageMedia | null>(null);
  const [forwarding, setForwarding] = useState<ForwardPayload | null>(null);
  const [replyTo, setReplyTo] = useState<GroupReply | null>(null);

  const toast = (text: string) => {
    if (Platform.OS === 'android') ToastAndroid.show(text, ToastAndroid.SHORT);
    else Alert.alert(text);
  };

  const handleSend = async (text: string) => {
    const result = await g.send(text, replyTo ?? undefined);
    setReplyTo(null);
    return result;
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
      {g.showJoin ? (
        <GroupJoinPrompt onJoin={g.join} loading={g.sending} />
      ) : g.canSend ? (
        <ChatInputBar
          onSend={handleSend}
          placeholder="Message..."
          loading={g.sending}
          onAttachment={g.openAttachmentMenu}
          replyingTo={replyTo?.senderName}
          onCancelReply={() => setReplyTo(null)}
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
