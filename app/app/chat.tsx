import React, { useEffect, useRef, useState } from 'react';
import { ToastAndroid, Platform, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useDirectMessages } from '@/hooks/useDirectMessages';
import ChatScreenShell from '@/components/chat/ChatScreenShell';
import ChatHeader from '@/components/chat/ChatHeader';
import ChatMessageList from '@/components/chat/ChatMessageList';
import BlockedConversationBanner from '@/components/chat/BlockedConversationBanner';
import ChatInputBar from '@/components/chat/ChatInputBar';
import MessageActionSheet, { MessageActionTarget } from '@/components/chat/MessageActionSheet';
import AttachmentPickerSheet from '@/components/chat/AttachmentPickerSheet';
import AttachmentPreview from '@/components/chat/AttachmentPreview';
import ImageCropper from '@/components/chat/ImageCropper';
import MediaViewer from '@/components/chat/MediaViewer';
import ForwardSheet, { ForwardPayload } from '@/components/chat/ForwardSheet';
import { DirectMessage, DirectMessageMedia, DirectMessageReply } from '@/components/chat/ChatMessageBubble';
import { useChatAttachment } from '@/hooks/useChatAttachment';
import { readStagedShare } from '@/utils/shareIntent';

export default function ChatScreen() {
  const { userId, name, shareToken } = useLocalSearchParams<{
    userId: string;
    name: string;
    shareToken?: string;
  }>();
  const c = useDirectMessages(userId, name);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewing, setViewing] = useState<DirectMessageMedia | null>(null);
  const [forwarding, setForwarding] = useState<ForwardPayload | null>(null);
  const [replyTo, setReplyTo] = useState<DirectMessageReply | null>(null);
  const [sharedText, setSharedText] = useState<string | undefined>();
  const attachment = useChatAttachment();

  /**
   * Content arriving from the OS share sheet, chosen for this chat on the
   * "Share to" screen. It is only staged — into the same composer and the same
   * attachment strip a normal message uses — and waits for Send like anything
   * else the user typed.
   */
  const stagedToken = useRef<string | null>(null);
  useEffect(() => {
    if (!shareToken || stagedToken.current === shareToken) return;
    const share = readStagedShare(shareToken);
    if (!share) return;

    stagedToken.current = shareToken;
    if (share.files.length > 0) attachment.stageExternal(share.files);
    if (share.text) setSharedText(share.text);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attachment is recreated each render; the token guard is what makes this run once
  }, [shareToken]);

  /**
   * Upload first, then send. The message only exists once its media does —
   * sending immediately would put a bubble in the list pointing at a URL that
   * does not resolve yet, and there is no way to repair it if the upload then
   * fails.
   */
  const handleSend = async (text: string) => {
    const quoted = replyTo ?? undefined;

    if (!attachment.pending) {
      const sent = c.send(text, undefined, quoted);
      if (sent) setReplyTo(null);
      return sent;
    }

    // One message per file when several were shared at once. The caption and
    // the quote belong to the first: repeating them under every photo would
    // read as the same message sent over and over.
    const uploaded = await attachment.uploadAll();
    if (!uploaded) return false;

    for (let i = 0; i < uploaded.length; i++) {
      const sent = c.send(i === 0 ? text : '', uploaded[i], i === 0 ? quoted : undefined);
      if (!sent) return false;
    }

    attachment.clear();
    setReplyTo(null);
    return true;
  };

  const confirmCopied = () => {
    if (Platform.OS === 'android') ToastAndroid.show('Copied', ToastAndroid.SHORT);
    else Alert.alert('Copied');
  };

  return (
    // No KeyboardAvoidingView here: ChatInputBar lifts itself on Android.
    <ChatScreenShell
      header={
        <ChatHeader
          title={c.userName}
          avatar={{ uri: c.userAvatar, userId, name: c.userName }}
          onTitlePress={c.openPeerProfile}
        />
      }
    >
      <ChatMessageList
        ref={c.listRef}
        messages={c.messages}
        peerId={userId}
        onMessageLongPress={(message: DirectMessage, isMine: boolean) =>
          setActionTarget({ id: message.id, text: message.message, isMine })
        }
        onPressMedia={setViewing}
      />
      {c.isConversationBlocked && (
        <BlockedConversationBanner isBlockedByMe={c.isBlockedByMe} onUnblock={c.unblock} />
      )}
      {attachment.pending && (
        <AttachmentPreview
          attachment={attachment.pending}
          uploading={attachment.uploading}
          progress={attachment.progress}
          remaining={attachment.remaining}
          uploadIndex={attachment.uploadIndex}
          onRemove={attachment.clear}
        />
      )}

      <ChatInputBar
        onSend={handleSend}
        disabled={c.isConversationBlocked}
        loading={attachment.uploading}
        hasAttachment={!!attachment.pending}
        onAttachment={() => setPickerOpen(true)}
        replyingTo={replyTo?.senderName}
        onCancelReply={() => setReplyTo(null)}
        initialText={sharedText}
      />

      <MediaViewer
        media={viewing}
        onClose={() => setViewing(null)}
        onForward={(media) => setForwarding({ media })}
      />

      <ForwardSheet
        payload={forwarding}
        onClose={() => setForwarding(null)}
        onSent={(name) => {
          if (Platform.OS === 'android') ToastAndroid.show(`Sent to ${name}`, ToastAndroid.SHORT);
          else Alert.alert('Forwarded', `Sent to ${name}`);
        }}
      />

      {/* Opens straight after picking when the crop option was chosen.
          Cancelling keeps the picture as taken rather than throwing away the
          pick, since wanting the whole photo is a normal outcome of looking
          at it in the crop tool. */}
      <ImageCropper
        uri={attachment.pending?.wantsCrop ? attachment.pending.uri : null}
        width={attachment.pending?.width}
        height={attachment.pending?.height}
        onCancel={() =>
          attachment.applyCrop(
            attachment.pending!.uri,
            attachment.pending?.width ?? 0,
            attachment.pending?.height ?? 0
          )
        }
        onDone={({ uri, width, height }) => attachment.applyCrop(uri, width, height)}
      />

      <AttachmentPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(kind, edit) => {
          setPickerOpen(false);
          setTimeout(() => attachment.pick(kind, edit), 220);
        }}
      />

      <MessageActionSheet
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={c.deleteMessage}
        onCopied={confirmCopied}
        onReply={(t) => {
          const source = c.messages.find((m) => m.id === t.id);
          setReplyTo({
            messageId: t.id,
            senderName: t.isMine ? 'You' : c.userName,
            // The quote is a snapshot, so a photo with no caption still needs
            // something readable in it.
            preview: t.text || undefined,
            mediaType: source?.media?.type,
          });
        }}
        onForward={(t) => {
          const source = c.messages.find((m) => m.id === t.id);
          setForwarding({ content: t.text, media: source?.media });
        }}
      />
    </ChatScreenShell>
  );
}
