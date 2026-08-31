import { useEffect, useRef, useState } from 'react';
import { Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '@/utils/api';
import { formatTime } from '@/utils/date';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
import { useConfirm } from '@/hooks/useConfirm';
import { DirectMessage } from '@/components/chat/ChatMessageBubble';

/** Server message → list row. Sender may be populated or a bare id. */
const toDirectMessage = (msg: any, status?: DirectMessage['status']): DirectMessage => {
  const sender = msg.sender && typeof msg.sender === 'object' ? msg.sender._id : msg.sender || msg.senderId;
  return {
    id: msg._id || msg.id || Date.now().toString(),
    senderId: sender,
    message: msg.content,
    timestamp: formatTime(msg.createdAt || Date.now()),
    status: status || msg.status || 'sent',
  };
};

/**
 * All direct-message logic for one conversation: history + mark-read, the
 * peer's name/avatar, the four socket listeners (receive / sent / status /
 * error), optimistic send, delete, and block state. The screen and its
 * components stay presentational.
 */
export function useDirectMessages(userId: string | undefined, initialName?: string) {
  const router = useRouter();
  const { user, token, blockedUsers, unblockUser } = useAuth();
  const { socket } = useSocket();
  const confirm = useConfirm();
  const listRef = useRef<FlatList<DirectMessage>>(null);

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [userAvatar, setUserAvatar] = useState('');
  const [userName, setUserName] = useState(initialName || 'Chat');
  const [blockedByOther, setBlockedByOther] = useState(false);

  const isBlockedByMe = blockedUsers.some((id) => String(id) === String(userId));
  const isConversationBlocked = isBlockedByMe || blockedByOther;
  const currentUserId = user?.id || (user as any)?._id;

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ---- Peer info (avatar + name)
  useEffect(() => {
    if (!userId || !token) return;
    const loadUserData = async () => {
      try {
        const userData: any = await api.getUser(userId, token);
        if (userData) {
          setUserAvatar(userData.avatar || '');
          if (userData.name) setUserName(userData.name);
        }
      } catch (e) {
        console.error('[Chat] Error loading user data:', e);
      }
    };
    loadUserData();
  }, [userId, token]);

  // ---- History + mark read
  useEffect(() => {
    if (!userId || !token) return;
    const loadMessages = async () => {
      try {
        // The api wrapper unwraps the response (res.data.data or res.data)
        const history: any[] = (await api.conversation(userId, token)) || [];
        setMessages(history.length > 0 ? history.map((msg) => toDirectMessage(msg)) : []);
        setBlockedByOther(false);
      } catch (e) {
        if ((e as Error)?.message?.toLowerCase().includes('blocked')) {
          setBlockedByOther(true);
          setMessages([]);
          return;
        }
        console.error('[Chat] Error loading history:', e);
        setMessages([]);
      }
    };

    const markRead = async () => {
      try {
        // MessageContext polls the global badge, so it refreshes on its own.
        await api.markConversationRead(userId, token);
      } catch (e) {
        console.error('[Chat] Error marking read:', e);
      }
    };

    loadMessages();
    markRead();
  }, [userId, token]);

  // ---- Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: any) => {
      const sender =
        message.sender && typeof message.sender === 'object' ? message.sender._id : message.sender || message.senderId;
      const recipient =
        message.recipient && typeof message.recipient === 'object'
          ? message.recipient._id
          : message.recipient || message.recipientId;

      if (sender === userId || recipient === userId || sender === currentUserId || recipient === currentUserId) {
        // Incoming is implicitly delivered
        setMessages((prev) => [...prev, toDirectMessage(message, 'delivered')]);
      }
    };

    // Status updates: a single message, or (no messageId) the whole
    // conversation read by the peer.
    const handleStatusUpdate = (payload: any) => {
      const { messageId, status } = payload;
      setMessages((prev) =>
        prev.map((msg) => {
          if (messageId && msg.id === messageId) return { ...msg, status };
          if (status === 'read' && !messageId) return { ...msg, status: 'read' };
          return msg;
        })
      );
    };

    const handleMessageSent = (message: any) => {
      setMessages((prev) => {
        // Replace the optimistic message (temp id + same content)
        const filtered = prev.filter((m) => !m.id.startsWith('temp-') || m.message !== message.content);
        if (filtered.some((m) => m.id === (message._id || message.id))) return filtered;
        return [...filtered, toDirectMessage(message)];
      });
      scrollToEnd();
    };

    const handleMessageError = (payload: any) => {
      const errorMessage = payload?.message || 'Failed to send message';
      if (String(errorMessage).toLowerCase().includes('blocked')) setBlockedByOther(true);
      Alert.alert('Message not sent', errorMessage);
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('message_status_update', handleStatusUpdate);
    socket.on('message_error', handleMessageError);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('message_status_update', handleStatusUpdate);
      socket.off('message_error', handleMessageError);
    };
  }, [socket, userId, currentUserId]);

  // ---- Send (optimistic). Returns false so ChatInputBar keeps the text.
  const send = (content: string): boolean => {
    if (isConversationBlocked) {
      Alert.alert(
        'Messaging unavailable',
        isBlockedByMe ? 'You blocked this user. Unblock them to send messages.' : 'You cannot message this user right now.'
      );
      return false;
    }

    if (!socket) {
      console.error('[CHAT] No socket instance available');
      return false;
    }

    if (!socket.connected) {
      // Kick a reconnect attempt so "try again" can actually succeed
      socket.connect();
      Alert.alert('Connection Error', 'Socket not connected. Please wait a moment and try again.');
      return false;
    }

    socket.emit('send_message', { to: userId, content });

    // Replaced by the message_sent event
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        senderId: currentUserId,
        message: content,
        timestamp: formatTime(Date.now()),
        status: 'sent',
      },
    ]);
    scrollToEnd();
    return true;
  };

  // ---- Delete own message
  const deleteMessage = async (messageId: string) => {
    const confirmed = await confirm({
      title: 'Delete Message',
      message: 'Are you sure you want to delete this message?',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!confirmed || !token) return;
    try {
      await api.deleteMessage(messageId, token);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete message:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // ---- Unblock
  const unblock = async () => {
    try {
      await unblockUser(String(userId));
      setBlockedByOther(false);
    } catch {
      Alert.alert('Error', 'Failed to unblock user');
    }
  };

  const openPeerProfile = () => {
    if (userId) router.push({ pathname: '/user/[id]', params: { id: userId } });
  };

  return {
    listRef,
    messages,
    userName,
    userAvatar,
    isBlockedByMe,
    isConversationBlocked,
    send,
    deleteMessage,
    unblock,
    openPeerProfile,
  };
}
