import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, LucideIcon } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import Avatar from '@/components/ui/Avatar';
import HeaderIconButton from '@/components/ui/HeaderIconButton';

interface ChatHeaderProps {
  title: string;
  subtitle?: string;
  /** Peer avatar (direct messages). Omitted for group chats. */
  avatar?: { uri?: string | null; userId?: string; name?: string };
  /** Makes the avatar + title tappable (e.g. open the peer's profile). */
  onTitlePress?: () => void;
  /** Optional icon action on the right (e.g. group options menu). */
  rightAction?: { icon: LucideIcon; onPress: () => void; accessibilityLabel?: string };
}

/**
 * The custom top bar drawn by the chat screens (which hide the native
 * header): back chevron, optional avatar, title/subtitle, optional right
 * action. Includes the top safe-area inset.
 */
export default function ChatHeader({ title, subtitle, avatar, onTitlePress, rightAction }: ChatHeaderProps) {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <>
      {avatar && (
        <Avatar
          uri={avatar.uri}
          userId={avatar.userId}
          name={avatar.name}
          size={40}
          style={[styles.avatar, { backgroundColor: colors.surface }]}
        />
      )}
      <View style={styles.titles}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </>
  );

  return (
    <View style={{ paddingTop: insets.top, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        {onTitlePress ? (
          <TouchableOpacity style={styles.content} onPress={onTitlePress} activeOpacity={0.7}>
            {content}
          </TouchableOpacity>
        ) : (
          <View style={styles.content}>{content}</View>
        )}
        {rightAction && (
          <HeaderIconButton
            icon={rightAction.icon}
            onPress={rightAction.onPress}
            size={22}
            accessibilityLabel={rightAction.accessibilityLabel}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {},
  titles: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
});
