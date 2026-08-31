import React from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { usePostDetail } from '@/hooks/usePostDetail';
import Screen from '@/components/layout/Screen';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ChatInputBar from '@/components/chat/ChatInputBar';
import PostBackButton from '@/components/post/PostBackButton';
import PostNotFound from '@/components/post/PostNotFound';
import PostAuthorHeader from '@/components/post/PostAuthorHeader';
import PostMedia from '@/components/post/media/PostMedia';
import PostCaption from '@/components/post/PostCaption';
import PostActionsBar from '@/components/post/PostActionsBar';
import CommentList from '@/components/post/CommentList';
import EditCaptionSheet from '@/components/post/EditCaptionSheet';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const p = usePostDetail(id);

  if (p.loading) {
    return (
      <Screen title="Post" scroll={false} padded={false}>
        <LoadingScreen />
      </Screen>
    );
  }

  if (!p.post) {
    return (
      <Screen title="Post" scroll={false} padded={false}>
        <PostNotFound />
      </Screen>
    );
  }

  const post = p.post;

  return (
    <Screen title="Post" headerLeft={() => <PostBackButton />} scroll={false} padded={false}>
      {/* The composer must sit inside the KAV so it lifts with the keyboard on iOS
          (Screen's footer slot renders outside its KAV). Android pads itself. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {post.author && (
            <PostAuthorHeader author={post.author} onPressAuthor={p.goToUser} onPressMore={p.handleMoreOptions} />
          )}
          <PostMedia source={post} audioId={id} variant="detail" />
          <PostCaption caption={post.caption} createdAt={post.createdAt} />
          <PostActionsBar
            isLiked={p.isLiked}
            likesCount={p.likesCount}
            onLike={p.handleLike}
            onShare={p.handleShare}
          />
          <CommentList
            comments={p.comments}
            totalCount={post.engagement?.commentsCount}
            isCommentAuthor={p.isCommentAuthor}
            canDelete={p.canDeleteComment}
            onPressUser={p.goToUser}
            onReply={p.handleReply}
            onDelete={p.handleDeleteComment}
            onReport={p.handleReportComment}
            onOptions={p.handleCommentOptions}
            onLoadReplies={p.loadReplies}
          />
        </ScrollView>

        <ChatInputBar
          ref={p.commentInputRef}
          onSend={p.handleAddComment}
          loading={p.submitting}
          placeholder={p.replyTo ? `Reply to ${p.replyTo.user.name}...` : 'Add a comment...'}
          replyingTo={p.replyTo?.user.name}
          onCancelReply={p.cancelReply}
          maxLength={500}
        />

        <EditCaptionSheet
          visible={p.editCaption.visible}
          value={p.editCaption.value}
          loading={p.editCaption.loading}
          onChange={p.editCaption.setValue}
          onClose={p.editCaption.close}
          onSubmit={p.editCaption.submit}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
