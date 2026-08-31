import { LucideIcon, Grid3x3, Video, Music, Image as ImageIcon, FileText, Type } from 'lucide-react-native';
import { ContentType, UserPost } from '@/types';

/** A profile grid filter: every content type, or 'all'. */
export type ContentFilter = ContentType | 'all';

export interface ContentFilterOption {
  id: ContentFilter;
  label: string;
  icon: LucideIcon;
}

/** The filter tabs above a profile's post grid, in display order. */
export const CONTENT_FILTERS: ContentFilterOption[] = [
  { id: 'all', label: 'All', icon: Grid3x3 },
  { id: 'video', label: 'Videos', icon: Video },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'image', label: 'Images', icon: ImageIcon },
  { id: 'script', label: 'Scripts', icon: FileText },
  { id: 'text', label: 'Text', icon: Type },
];

export function filterPostsByType<T extends Pick<UserPost, 'type'>>(posts: T[], filter: ContentFilter): T[] {
  if (!Array.isArray(posts)) return [];
  return filter === 'all' ? posts : posts.filter((post) => post.type === filter);
}

/** "No posts yet" / "No video yet" — the grid's empty-state title for a filter. */
export function emptyTitleForFilter(filter: ContentFilter): string {
  return `No ${filter === 'all' ? 'posts' : filter} yet`;
}
