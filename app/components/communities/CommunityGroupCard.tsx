import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CommunityGroup } from '@/types';
import { Volume2, Hash, MessageSquare, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface CommunityGroupCardProps {
  group: CommunityGroup;
  onPress: () => void;
  onJoin?: () => void;
  showJoin?: boolean;
}

export default function CommunityGroupCard({ group, onPress, onJoin, showJoin }: CommunityGroupCardProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  const handleJoin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onJoin) onJoin();
  };

  const getIcon = () => {
    if (group.isAnnouncementOnly) {
      return <Volume2 size={24} color={colors.primary} />;
    }
    if (group.type === 'discussion') {
      return <MessageSquare size={24} color={colors.text} />;
    }
    return <Hash size={24} color={colors.text} />;
  };

  const shouldShowJoin = showJoin !== undefined ? showJoin : !group.isMember;

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
    >
      <View style={[styles.iconContainer, { backgroundColor: colors.background }]}>
        {getIcon()}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]}>
            {group.name}
          </Text>
          {group.isAnnouncementOnly && (
            <View style={[styles.badge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Official</Text>
            </View>
          )}
        </View>

        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={1}>
          {group.description || `${group.memberCount} members`}
        </Text>
      </View>

      {shouldShowJoin && (
        <TouchableOpacity
          style={[styles.joinButton, { backgroundColor: colors.primary + '15' }]}
          onPress={handleJoin}
        >
          <Text style={[styles.joinText, { color: colors.primary }]}>Join</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  description: {
    fontSize: 14,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  joinButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '600',
  }
});
