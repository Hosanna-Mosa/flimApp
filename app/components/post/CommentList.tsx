import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Comment } from '@/types';
import CommentItem, { CommentItemCallbacks } from './CommentItem';

interface CommentListProps extends CommentItemCallbacks {
  comments: Comment[];
  /** Post-level count shown in the title; falls back to the list length. */
  totalCount?: number;
}

/** "Comments (n)" heading plus the top-level comment threads. */
export default function CommentList({ comments, totalCount, ...callbacks }: CommentListProps) {
  const { colors } = useTheme();
  const topLevel = comments.filter((comment) => comment.user && !comment.parentComment);

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.text }]}>Comments ({totalCount || comments.length})</Text>
      {topLevel.map((comment) => (
        <CommentItem key={comment._id} comment={comment} {...callbacks} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
});
