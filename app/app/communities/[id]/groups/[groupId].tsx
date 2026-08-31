import React from 'react';
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

export default function GroupChatScreen() {
  const { id, groupId } = useLocalSearchParams<{ id: string; groupId: string }>();
  const g = useGroupChat(id, groupId);

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
        onLongPress={g.deleteMessage}
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
        <ChatInputBar onSend={g.send} placeholder="Message..." loading={g.sending} onAttachment={g.openAttachmentMenu} />
      ) : (
        <GroupReadOnlyFooter groupFound={!!g.group} />
      )}
    </ChatScreenShell>
  );
}
