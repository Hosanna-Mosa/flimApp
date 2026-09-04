import React, { useState } from 'react';
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
import MediaViewer from '@/components/chat/MediaViewer';
import ForwardSheet, { ForwardPayload } from '@/components/chat/ForwardSheet';
import { DirectMessage, DirectMessageMedia } from '@/components/chat/ChatMessageBubble';
import { useChatAttachment } from '@/hooks/useChatAttachment';

export default function ChatScreen() {
  const { userId, name } = useLocalSearchParams<{ userId: string; name: string }>();
  const c = useDirectMessages(userId, name);
  const [actionTarget, setActionTarget] = useState<MessageActionTarget | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [viewing, setViewing] = useState<DirectMessageMedia | null>(null);
  const [forwarding, setForwarding] = useState<ForwardPayload | null>(null);
  const attachment = useChatAttachment();

  /**
   * Upload first, then send. The message only exists once its media does —
   * sending immediately would put a bubble in the list pointing at a URL that
   * does not resolve yet, and there is no way to repair it if the upload then
   * fails.
   */
  const handleSend = async (text: string) => {
    if (!attachment.pending) return c.send(text);

    const uploaded = await attachment.upload();
    if (!uploaded) return false;

    const ok = c.send(text, uploaded);
    if (ok) attachment.clear();
    return ok;
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
          onRemove={attachment.clear}
        />
      )}

      <ChatInputBar
        onSend={handleSend}
        disabled={c.isConversationBlocked}
        loading={attachment.uploading}
        hasAttachment={!!attachment.pending}
        onAttachment={() => setPickerOpen(true)}
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

      <AttachmentPickerSheet
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(kind) => {
          setPickerOpen(false);
          setTimeout(() => attachment.pick(kind), 220);
        }}
      />

      <MessageActionSheet
        target={actionTarget}
        onClose={() => setActionTarget(null)}
        onDelete={c.deleteMessage}
        onCopied={confirmCopied}
        onForward={(t) => {
          const source = c.messages.find((m) => m.id === t.id);
          setForwarding({ content: t.text, media: source?.media });
        }}
      />
    </ChatScreenShell>
  );
}
