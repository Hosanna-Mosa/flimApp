import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import BottomSheet from '@/components/ui/BottomSheet';
import Avatar from '@/components/ui/Avatar';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useConversations, ConversationItem } from '@/hooks/useConversations';
import { api } from '@/utils/api';
import { DirectMessageMedia } from './ChatMessageBubble';

export interface ForwardPayload {
  content?: string;
  media?: DirectMessageMedia;
}

interface ForwardSheetProps {
  payload: ForwardPayload | null;
  onClose: () => void;
  onSent?: (recipientName: string) => void;
}

/**
 * Pick someone to forward a message to.
 *
 * Only existing conversations are listed. Forwarding to a stranger is really
 * "start a chat", which is what the people screen is for — offering it here
 * would make this a second, worse contact picker.
 *
 * Sends over REST rather than the chat socket, which is bound to whichever
 * conversation is open; forwarding is by definition sending elsewhere.
 */
export default function ForwardSheet({ payload, onClose, onSent }: ForwardSheetProps) {
  const { colors } = useTheme();
  const { token } = useAuth();
  const { chats, loading } = useConversations();
  const [sendingTo, setSendingTo] = useState<string | null>(null);

  if (!payload) return null;

  const forwardTo = async (recipientId: string, recipientName: string) => {
    if (!token) return;
    setSendingTo(recipientId);
    try {
      await api.sendMessage(
        {
          recipientId,
          content: payload.content || '',
          media: payload.media ? { ...payload.media } : undefined,
        },
        token
      );
      onClose();
      onSent?.(recipientName);
    } catch (err) {
      console.error('[chat] Forward failed:', err);
      Alert.alert('Could not forward', 'The message was not sent. Try again.');
    } finally {
      setSendingTo(null);
    }
  };

  return (
    <BottomSheet visible onClose={onClose} title="Forward to">
      {loading ? (
        <View style={styles.centre}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          No conversations yet. Start one from the people screen, then you can forward into it.
        </Text>
      ) : (
        <View>
          {chats.map((c: ConversationItem) => (
            <TouchableOpacity
              key={c.id}
              style={styles.row}
              onPress={() => forwardTo(c.user.id, c.user.name)}
              disabled={!!sendingTo}
              activeOpacity={0.6}
            >
              <Avatar uri={c.user.avatar} name={c.user.name} size={42} />
              <View style={styles.meta}>
                <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                  {c.user.name}
                </Text>
                <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={1}>
                  {c.lastMessage || 'No messages yet'}
                </Text>
              </View>
              {sendingTo === c.user.id && <ActivityIndicator size="small" color={colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  centre: { paddingVertical: 30, alignItems: 'center' },
  empty: { fontSize: 14, lineHeight: 20, paddingVertical: 18, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  meta: { flex: 1, minWidth: 0 },
  name: { fontSize: 16, fontWeight: '600' },
  preview: { fontSize: 13, marginTop: 1 },
});
