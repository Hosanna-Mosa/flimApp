import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { PostAuthor } from '@/types';
import Avatar from '@/components/ui/Avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

interface PostAuthorHeaderProps {
  author: PostAuthor;
  onPressAuthor: (userId: string) => void;
  onPressMore: () => void;
}

/** Avatar · name · roles · more-options row above a post's media. */
export default function PostAuthorHeader({ author, onPressAuthor, onPressMore }: PostAuthorHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => onPressAuthor(author._id)}>
        <Avatar uri={author.avatar} userId={author._id} name={author.name} size={48} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.userInfo} onPress={() => onPressAuthor(author._id)}>
        <View style={styles.nameRow}>
          <Text style={[styles.userName, { color: colors.text }]}>{author.name || 'Unknown User'}</Text>
          <VerifiedBadge visible={author.isBadgeVerified} size={16} />
        </View>
        <Text style={[styles.role, { color: colors.textSecondary }]}>
          {author.roles?.slice(0, 2).join(' • ')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onPressMore} style={styles.moreButton}>
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 8,
  },
});
