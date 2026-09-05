import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SendHorizontal, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useKeyboardOverlap } from '@/hooks/useKeyboardOverlap';

interface ChatInputBarProps {
  /**
   * Called with the trimmed text. Return false (or resolve to false) to keep
   * the text in the input (e.g. send failed); anything else clears it. Async
   * handlers are awaited, so the input clears only once they complete.
   */
  onSend: (text: string) => boolean | void | Promise<boolean | void>;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  /** When provided, shows the attachment (+) button. */
  onAttachment?: () => void;
  /**
   * Set when a file is staged for sending. Without it the composer refuses to
   * send an empty caption, so attaching a photo and pressing send does
   * nothing — which reads as the send being broken rather than as a rule.
   */
  hasAttachment?: boolean;
  /** Shows a "Replying to <name>" banner above the input with a Cancel action. */
  replyingTo?: string;
  onCancelReply?: () => void;
  maxLength?: number;
}

export interface ChatInputBarHandle {
  focus: () => void;
}

/**
 * The one text composer for the app — direct chat, group chat, and post
 * comments all use it. Differences between those contexts are props, not
 * separate components.
 */
const ChatInputBar = forwardRef<ChatInputBarHandle, ChatInputBarProps>(function ChatInputBar(
  {
    onSend,
    placeholder = 'Type a message...',
    disabled,
    hasAttachment,
    loading,
    onAttachment,
    replyingTo,
    onCancelReply,
    maxLength,
  },
  ref
) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  // Android: lift by however much the keyboard actually covers (0 when the
  // OS already resized the window). iOS screens use KeyboardAvoidingView.
  const keyboardOverlap = useKeyboardOverlap();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  const handleSendPress = async () => {
    const content = text.trim();
    // A caption is optional once something is attached; the message is the file.
    if (!content && !hasAttachment) return;
    const result = await onSend(content);
    if (result !== false) setText('');
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, borderTopColor: colors.border, paddingBottom: keyboardOverlap },
      ]}
    >
      {!!replyingTo && (
        <View style={[styles.replyBanner, { backgroundColor: colors.surface }]}>
          <Text style={[styles.replyText, { color: colors.textSecondary }]} numberOfLines={1}>
            Replying to <Text style={{ fontWeight: '700', color: colors.text }}>{replyingTo}</Text>
          </Text>
          {onCancelReply && (
            <TouchableOpacity onPress={onCancelReply} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ color: colors.primary, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.row, { paddingBottom: keyboardOverlap > 0 ? 12 : insets.bottom || 12 }]}>
        {onAttachment && (
          <TouchableOpacity
            style={styles.attachButton}
            onPress={onAttachment}
            disabled={disabled || loading}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TextInput
          ref={inputRef}
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={maxLength}
          editable={!disabled && !loading}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: colors.primary }]}
          onPress={handleSendPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          disabled={disabled || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <SendHorizontal size={20} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default ChatInputBar;

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  replyText: {
    flex: 1,
    fontSize: 13,
    marginRight: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    gap: 12,
  },
  attachButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
