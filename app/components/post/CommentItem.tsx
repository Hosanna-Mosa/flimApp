import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDateTime } from '@/utils/date';
import { Comment } from '@/types';
import Avatar from '@/components/ui/Avatar';
import VerifiedBadge from '@/components/ui/VerifiedBadge';

export interface CommentItemCallbacks {
  /** Whether the viewer wrote this comment (hides Report, allows Delete). */
  isCommentAuthor: (comment: Comment) => boolean;
  /** Whether the viewer may delete this comment (its author or the post author). */
  canDelete: (comment: Comment) => boolean;
  onPressUser: (userId: string) => void;
  onReply: (comment: Comment) => void;
  onDelete: (commentId: string, isReply: boolean, parentId?: string) => void;
  onReport: (commentId: string) => void;
  onOptions: (comment: Comment) => void;
  /** Fetches the full reply list for a comment into the comment state. */
  onLoadReplies: (commentId: string) => Promise<void>;
}

interface CommentItemProps extends CommentItemCallbacks {
  comment: Comment;
  isReply?: boolean;
  parentId?: string;
}

/**
 * One comment with its footer actions; renders its replies recursively and
 * owns the show/hide toggle for them.
 */
export default function CommentItem(props: CommentItemProps) {
  const { comment, isReply = false, parentId, isCommentAuthor, canDelete } = props;
  const { colors } = useTheme();
  const [hidden, setHidden] = useState(false);

  const isOwn = isCommentAuthor(comment);
  const hasReplies = !!comment.replies && comment.replies.length > 0;
  const hasMoreReplies =
    !!comment.repliesCount && (!comment.replies || comment.replies.length < comment.repliesCount);

  const loadMore = async () => {
    try {
      await props.onLoadReplies(comment._id);
      // Ensure they are not hidden when loading more
      setHidden(false);
    } catch {
      // keep current state
    }
  };

  return (
    <View style={[styles.item, isReply && styles.replyItem]}>
      <TouchableOpacity onPress={() => props.onPressUser(comment.user._id)}>
        <Avatar
          uri={comment.user?.avatar}
          userId={comment.user?._id}
          name={comment.user?.name}
          size={isReply ? 24 : 32}
        />
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <TouchableOpacity onPress={() => props.onPressUser(comment.user._id)}>
              <View style={styles.nameRow}>
                <Text style={[styles.userName, { color: colors.text }]}>
                  {comment.user?.name || 'Unknown User'}
                </Text>
                <VerifiedBadge visible={comment.user?.isVerified} size={12} />
              </View>
            </TouchableOpacity>
            <Text style={[styles.text, { color: colors.text }]}>{comment.content}</Text>
            <View style={styles.footer}>
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatDateTime(comment.createdAt)}
              </Text>
              {!isReply && (
                <TouchableOpacity onPress={() => props.onReply(comment)} style={styles.footerAction}>
                  <Text style={[styles.footerActionText, { color: colors.textSecondary }]}>Reply</Text>
                </TouchableOpacity>
              )}
              {canDelete(comment) && (
                <TouchableOpacity
                  onPress={() => props.onDelete(comment._id, isReply, parentId)}
                  style={styles.footerAction}
                >
                  <Text style={[styles.footerActionText, { color: colors.error }]}>Delete</Text>
                </TouchableOpacity>
              )}
              {!isOwn && (
                <TouchableOpacity onPress={() => props.onReport(comment._id)} style={styles.footerAction}>
                  <Text style={[styles.footerActionText, { color: colors.textSecondary }]}>Report</Text>
                </TouchableOpacity>
              )}
              {hasReplies && (
                <TouchableOpacity onPress={() => setHidden((h) => !h)} style={styles.footerAction}>
                  <Text style={[styles.footerActionText, { color: colors.primary }]}>
                    {hidden ? 'Show replies' : 'Hide replies'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <TouchableOpacity
            onPress={() => props.onOptions(comment)}
            style={styles.menuButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MoreVertical size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {hasReplies && !hidden && (
          <View style={styles.replies}>
            {comment.replies!.map((reply) => (
              <CommentItem key={reply._id} {...props} comment={reply} isReply parentId={comment._id} />
            ))}
          </View>
        )}

        {hasMoreReplies && (
          <TouchableOpacity style={styles.showMore} onPress={loadMore}>
            <Text style={[styles.showMoreText, { color: colors.primary }]}>
              {hidden
                ? `Show ${comment.repliesCount} replies`
                : `View ${(comment.repliesCount || 0) - (comment.replies?.length || 0)} more replies`}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  replyItem: {
    marginTop: 12,
    marginBottom: 4,
  },
  flex: {
    flex: 1,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  text: {
    fontSize: 14,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 16,
  },
  time: {
    fontSize: 12,
    marginTop: 4,
  },
  footerAction: {
    paddingVertical: 4,
  },
  footerActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  menuButton: {
    marginLeft: 8,
    paddingTop: 2,
  },
  replies: {
    marginTop: 8,
  },
  showMore: {
    marginTop: 8,
    paddingVertical: 4,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
