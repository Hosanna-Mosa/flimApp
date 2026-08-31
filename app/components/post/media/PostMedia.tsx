import React from 'react';
import { PostMediaSource } from '@/types';
import PostVideoPlayer, { PostMediaVariant } from './PostVideoPlayer';
import PostAudioPlayer from './PostAudioPlayer';
import PostImage from './PostImage';
import PostScriptCard from './PostScriptCard';
import PdfCarousel, { getPdfPageUrls } from './PdfCarousel';

interface PostMediaProps {
  source: PostMediaSource;
  /** Post id — scopes audio playback so only one post plays at a time. */
  audioId: string;
  /** In a list: drives video autoplay and audio/video pause. Omit on a single-post screen. */
  isActive?: boolean;
  /** 'feed' is full-bleed (Instagram card); 'detail' insets audio/script cards. */
  variant?: PostMediaVariant;
}

function safeAspectRatio(source: PostMediaSource, fallback: number): number {
  const { width, height } = source.media ?? {};
  if (width && height && height > 0) {
    const ratio = width / height;
    if (isFinite(ratio) && ratio > 0) return ratio;
  }
  return fallback;
}

/**
 * The one media renderer for a post: picks the player/card for the post's
 * content type. Used by both the feed card and the post detail screen.
 */
export default function PostMedia({ source, audioId, isActive, variant = 'feed' }: PostMediaProps) {
  const mediaUrl = source.media?.url || source.mediaUrl;
  const thumbnailUrl = source.media?.thumbnail || source.thumbnailUrl;

  if (source.type === 'text') return null;

  if (source.type === 'audio') {
    return <PostAudioPlayer url={mediaUrl} audioId={audioId} isActive={isActive} variant={variant} />;
  }

  if (!mediaUrl) return null;

  if (source.type === 'video') {
    return (
      <PostVideoPlayer
        url={mediaUrl}
        thumbnailUrl={thumbnailUrl}
        aspectRatio={safeAspectRatio(source, 16 / 9)}
        isActive={isActive}
        variant={variant}
      />
    );
  }

  if (source.type === 'script') {
    const isPdf = mediaUrl.toLowerCase().endsWith('.pdf') || source.media?.format === 'pdf';
    const pages = source.media?.pages || 3;
    if (isPdf && getPdfPageUrls(mediaUrl, pages)) {
      return <PdfCarousel url={mediaUrl} pages={pages} />;
    }
    return <PostScriptCard url={mediaUrl} variant={variant} />;
  }

  return <PostImage url={mediaUrl} aspectRatio={safeAspectRatio(source, 1)} variant={variant} />;
}
