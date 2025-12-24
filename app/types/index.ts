export type UserRole =
  | 'actor'
  | 'director'
  | 'producer'
  | 'writer'
  | 'dop'
  | 'editor'
  | 'music'
  | 'vfx'
  | 'sound'
  | 'makeup'
  | 'costume';

export type Industry =
  | 'bollywood'
  | 'tollywood'
  | 'kollywood'
  | 'mollywood'
  | 'sandalwood'
  | 'punjabi'
  | 'bengali'
  | 'bhojpuri'
  | 'marathi';

export type ContentType = 'video' | 'audio' | 'image' | 'script';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  bio: string;
  roles: UserRole[];
  industries: Industry[];
  experience: number;
  location: string;
  isOnline: boolean;
  isPrivate?: boolean;
  isVerified?: boolean;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  type: ContentType;
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: string;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  memberCount: number;
  industry: Industry;
  isMember: boolean;
}

export interface Message {
  id: string;
  userId: string;
  user: User;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Chat {
  id: string;
  user: User;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
