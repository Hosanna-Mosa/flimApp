import { Post, User } from '@/types';

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Raj Malhotra',
    email: 'raj@example.com',
    phone: '+91 98765 43210',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=raj',
    bio: 'Award-winning director with 15+ years in Bollywood',
    roles: ['director', 'producer'],
    industries: ['bollywood'],
    experience: 15,
    location: 'Mumbai',
    isOnline: true,
    isVerified: true,
  },
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91 98765 43211',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=priya',
    bio: 'Cinematographer | Capturing stories through lens',
    roles: ['dop', 'editor'],
    industries: ['bollywood', 'punjabi'],
    experience: 8,
    location: 'Delhi',
    isOnline: false,
  },
  {
    id: '3',
    name: 'Arjun Kumar',
    email: 'arjun@example.com',
    phone: '+91 98765 43212',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=arjun',
    bio: 'Actor | Theater to Cinema',
    roles: ['actor'],
    industries: ['tollywood', 'kollywood'],
    experience: 5,
    location: 'Hyderabad',
    isOnline: true,
  },
  {
    id: '4',
    name: 'Maya Iyer',
    email: 'maya@example.com',
    phone: '+91 98765 43213',
    avatar: 'https://api.dicebear.com/7.x/avataaars/png?seed=maya',
    bio: 'Music Composer | Blending tradition with modern',
    roles: ['music'],
    industries: ['mollywood', 'kollywood'],
    experience: 12,
    location: 'Chennai',
    isOnline: true,
  },
];

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    type: 'video',
    mediaUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800',
    caption:
      'Behind the scenes from our latest shoot! The dedication and hard work that goes into every frame is incredible. #FilmMaking #BTS',
    likes: 234,
    comments: 45,
    shares: 12,
    isLiked: false,
    createdAt: '2h ago',
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    type: 'image',
    mediaUrl:
      'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800',
    caption:
      'Golden hour magic ✨ Nothing beats natural lighting for emotional scenes.',
    likes: 189,
    comments: 23,
    shares: 8,
    isLiked: true,
    createdAt: '5h ago',
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    type: 'video',
    mediaUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800',
    caption:
      'Action sequence rehearsal. Perfecting every move before the final take! 🎬',
    likes: 412,
    comments: 67,
    shares: 23,
    isLiked: true,
    createdAt: '1d ago',
  },
  {
    id: '4',
    userId: '4',
    user: mockUsers[3],
    type: 'audio',
    mediaUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    caption:
      'Working on the theme for an upcoming romantic drama. Traditional instruments meet modern production 🎵',
    likes: 156,
    comments: 34,
    shares: 19,
    isLiked: false,
    createdAt: '2d ago',
  },
  {
    id: '5',
    userId: '1',
    user: mockUsers[0],
    type: 'script',
    mediaUrl:
      'https://images.unsplash.com/photo-1517842264405-c7fe8bdf42eb?w=800',
    caption:
      'Excited to share a glimpse of our upcoming project screenplay. Years of research went into this! 📝',
    likes: 298,
    comments: 56,
    shares: 31,
    isLiked: true,
    createdAt: '3d ago',
  },
];

export { mockUsers };
