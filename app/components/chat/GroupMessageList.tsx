import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { CommunityPost } from '@/types';
import GroupMessageBubble from './GroupMessageBubble';

interface GroupMessageListProps {
  /** Newest first (the list is inverted). */
  posts: CommunityPost[];
  isMine: (post: CommunityPost) => boolean;
  onVote: (postId: string, optionIndex: number) => void;
  onLongPress: (post: CommunityPost) => void;
  /** Rendered at the TOP of the conversation (inverted list footer). */
  intro?: React.ReactElement;
}

/** Inverted group-chat list of GroupMessageBubbles. */
export default function GroupMessageList({ posts, isMine, onVote, onLongPress, intro }: GroupMessageListProps) {
  return (
    <FlatList
      style={styles.list}
      data={posts}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <GroupMessageBubble
          message={item}
          isMe={isMine(item)}
          onVote={(idx) => onVote(item._id, idx)}
          onLongPress={() => onLongPress(item)}
        />
      )}
      inverted
      contentContainerStyle={styles.content}
      ListFooterComponent={intro}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
  },
});
