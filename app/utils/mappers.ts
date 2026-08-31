import { Post } from '@/types';
import { formatDateTime } from '@/utils/date';

/**
 * The one place an API post becomes the app's `Post` model. Every screen
 * that lists posts (feed, saved, profiles…) must go through this so the
 * cards always receive the same shape — including a RAW `createdAt` ISO
 * string, which components format themselves via utils/date.
 */
export function mapApiPostToPost(p: any, overrides: Partial<Post> = {}): Post {
  const authorId = p.author?._id || p.author?.id || p.userId;
  return {
    ...p,
    id: p._id || p.id,
    userId: authorId,
    user: {
      ...(p.author || {}),
      id: authorId,
      name: p.author?.name || 'Unknown User',
      avatar: p.author?.avatar || '',
      isVerified: p.author?.isVerified || false,
      roles: p.author?.roles || [],
      isFollowing: p.author?.isFollowing || false,
    },
    type: p.type || 'image',
    mediaUrl: p.mediaUrl || p.media?.url,
    thumbnailUrl: p.thumbnailUrl || p.media?.thumbnail,
    media: p.media,
    caption: p.caption || '',
    likes: p.engagement?.likesCount ?? p.likes ?? 0,
    comments: p.engagement?.commentsCount ?? p.comments ?? 0,
    shares: p.engagement?.sharesCount ?? p.shares ?? 0,
    isLiked: p.isLiked || false,
    isSaved: p.isSaved || false,
    createdAt: p.createdAt || '',
    ...overrides,
  };
}

// ---- Notifications --------------------------------------------------------

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  /** Pre-formatted display string (see mapApiNotification). */
  time: string;
  isRead: boolean;
  type: string;
  metadata: any;
  actorId?: string;
  followerId?: string;
}

/**
 * The one place an API notification becomes the app's `NotificationItem`.
 * Used for both the initial fetch and live socket pushes (which pass
 * `{ time: 'Just now', isRead: false }` as overrides).
 */
export function mapApiNotification(n: any, overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: n._id,
    title: n.title,
    description: n.body,
    time: formatDateTime(n.createdAt),
    isRead: n.isRead,
    type: n.type,
    metadata: n.metadata || {},
    actorId: n.actor?._id || n.metadata?.actorId,
    followerId: n.metadata?.followerId || n.actor?._id,
    ...overrides,
  };
}
