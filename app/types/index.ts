export type UserRole =
  | 'actor'
  | 'director'
  | 'producer'
  | 'production_manager'
  | 'casting_artists'
  | 'story_screenplay_writer'
  | 'dialogue_writer'
  | 'music_director_composer'
  | 'lyrics_writer'
  | 'cinematographer_dop'
  | 'art_director'
  | 'makeup_department'
  | 'costume_designer'
  | 'choreographer'
  | 'stunt_master_action_director'
  | 'editor'
  | 'sound_designer_engineer'
  | 'playback_singers'
  | 'dubbing_artists'
  | 'vfx_cgi_department'
  | 'lighting_technicians'
  | 'camera_assistants_focus_pullers'
  | 'set_designers_workers'
  | 'production_assistants_ad_team'
  | 'publicity_promotion_pro';

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

export type ContentType = 'video' | 'audio' | 'image' | 'script' | 'text';

export interface User {
  _id?: string;
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
  isPrivate?: boolean; // Legacy field, use accountType instead
  accountType?: 'public' | 'private' | 'business';
  isVerified?: boolean;
  verificationStatus?: 'none' | 'pending_docs' | 'approved_docs' | 'pending_payment' | 'active' | 'rejected';
  verifiedUntil?: string;
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
  isSaved?: boolean;
  createdAt: string;
  media?: {
    url: string;
    thumbnail?: string;
    duration?: number;
    format?: string;
    size?: number;
    width?: number;
    height?: number;
    pages?: number;
    publicId?: string;
  };
}

// Community Types

export type CommunityPrivary = 'public' | 'private' | 'invite-only';
export type CommunityType = 'industry' | 'role' | 'project' | 'general';
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';
export type GroupType = 'announcement' | 'discussion' | 'general';
export type CommunityPostType = 'text' | 'image' | 'video' | 'poll' | 'announcement';

export interface CommunityGroup {
  _id: string;
  name: string;
  description: string;
  type: GroupType;
  isAnnouncementOnly: boolean;
  memberCount: number;
  members?: string[];
  isMember?: boolean;
}

export interface CommunityStats {
  totalPosts: number;
  totalMessages: number;
  activeMembers: number;
}

export interface CommunitySettings {
  allowMemberInvites: boolean;
  requireApproval: boolean;
  allowGroupCreation: boolean;
  maxGroups: number;
}

export interface Community {
  _id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  type: CommunityType;
  industry?: Industry;
  role?: string;
  privacy: CommunityPrivary;
  isVerified: boolean;
  createdBy: User | string;
  admins: (User | string)[];
  moderators: (User | string)[];
  members: (User | string)[];
  memberCount: number;
  groups: CommunityGroup[];
  settings: CommunitySettings;
  stats: CommunityStats;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // User context
  isMember?: boolean;
  memberRole?: CommunityRole;
  isPending?: boolean;
}

export interface CommunityMember {
  _id: string;
  community: string;
  user: User;
  role: CommunityRole;
  groups: string[];
  joinedAt: string;
  postsCount: number;
  messagesCount: number;
  isMuted: boolean;
  isBanned: boolean;
}

export interface PollOption {
  _id?: string;
  text: string;
  votes: string[]; // User IDs
}

export interface Poll {
  question: string;
  options: PollOption[];
  endsAt?: string;
  allowMultiple: boolean;
}

export interface CommunityPost {
  _id: string;
  community: string;
  group: string;
  author: User;
  type: CommunityPostType;
  content: string;
  media: {
    url: string;
    type: 'image' | 'video' | 'document';
    thumbnail?: string;
    size?: number;
    format?: string;
  }[];
  poll?: Poll;
  likes: string[]; // User IDs
  likesCount: number;
  commentsCount: number;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;

  // User context
  isLiked: boolean;
  hasVoted: boolean;
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
